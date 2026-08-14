import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { SignUpInput, SignUpOutput } from './dto/sign-up.dto';
import { SignInInput, SignInOutput } from './dto/sign-in.dto';
import { UserProfileInput, UserProfileOutput } from './dto/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dto/verify-email.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { AuthSessionId } from '../auth/decorator/auth-session-id.decorator';
import { SignOutOutput } from './dto/sign-out.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  getRefreshTokenCookie,
  getRefreshTokenTtlMs,
} from '../auth/auth.config';
import { RefreshAccessTokenOutput } from './dto/refresh-access-token.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Mutation(() => SignUpOutput)
  async signUp(@Args('input') signUpInput: SignUpInput): Promise<SignUpOutput> {
    return this.usersService.signUp(signUpInput);
  }

  @Mutation(() => SignInOutput)
  async signIn(
    @Args('input') signInInput: SignInInput,
    @Context() context: { res: Response },
  ): Promise<SignInOutput> {
    const result = await this.usersService.signIn(signInInput);
    if (result.ok && result.refreshToken) {
      this.setRefreshCookie(context.res, result.refreshToken);
    }
    return {
      ok: result.ok,
      error: result.error,
      accessToken: result.accessToken,
    };
  }

  @Roles('Any')
  @Query(() => User)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }

  @Roles('Any')
  @Query(() => UserProfileOutput)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }

  @Roles('Any')
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput.token);
  }

  @Roles('Any')
  @Mutation(() => SignOutOutput)
  async signOut(
    @AuthSessionId() sessionId: string,
    @Context() context: { res: Response },
  ): Promise<SignOutOutput> {
    const result = await this.usersService.signOut(sessionId);
    this.clearRefreshCookie(context.res);
    return result;
  }

  @Mutation(() => RefreshAccessTokenOutput)
  async refreshAccessToken(
    @Context() context: { req: Request; res: Response },
  ): Promise<RefreshAccessTokenOutput> {
    const refreshToken = this.readCookie(
      context.req.headers.cookie,
      getRefreshTokenCookie(this.configService),
    );
    if (!refreshToken) {
      return {
        ok: false,
        error: 'Refresh token is required.',
        accessToken: null,
        refreshToken: null,
      };
    }
    const result = await this.usersService.refreshAccessToken({ refreshToken });
    if (!result.ok || !result.refreshToken) {
      this.clearRefreshCookie(context.res);
      return {
        ok: false,
        error: result.error,
        accessToken: null,
        refreshToken: null,
      };
    }
    this.setRefreshCookie(context.res, result.refreshToken);
    return {
      ok: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(getRefreshTokenCookie(this.configService), refreshToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV ?? 'dev') === 'production',
      sameSite: 'lax',
      path: '/graphql',
      maxAge: getRefreshTokenTtlMs(this.configService),
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(getRefreshTokenCookie(this.configService), {
      httpOnly: true,
      secure: (process.env.NODE_ENV ?? 'dev') === 'production',
      sameSite: 'lax',
      path: '/graphql',
    });
  }

  private readCookie(
    cookieHeader: string | undefined,
    cookieName: string,
  ): string | null {
    if (!cookieHeader) {
      return null;
    }
    const prefix = `${cookieName}=`;
    for (const cookie of cookieHeader.split(';')) {
      const value = cookie.trim();
      if (value.startsWith(prefix)) {
        try {
          return decodeURIComponent(value.slice(prefix.length));
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
