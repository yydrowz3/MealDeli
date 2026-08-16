import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileOutput } from './dto/user-profile.dto';
import { User } from './entities/user.entity';
import { PublicUser } from './entities/public-user.entity';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { SignUpInput, SignUpOutput } from './dto/sign-up.dto';
import { SignInInput, SignInOutput } from './dto/sign-in.dto';
import * as argon2 from 'argon2';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';
import { VerifyEmailOutput } from './dto/verify-email.dto';
import { MailsService } from '../mails/mails.service';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import { SignOutOutput } from './dto/sign-out.dto';
import { ConfigService } from '@nestjs/config';
import { getRefreshTokenTtlMs } from '../auth/auth.config';
import { v7 as uuidv7 } from 'uuid';
import {
  RefreshAccessTokenInput,
  RefreshAccessTokenOutput,
} from './dto/refresh-access-token.dto';
import { TokenPayload } from '../auth/types/token-payload.type';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailsService: MailsService,
  ) {}

  async signUp({ email, name, password }: SignUpInput): Promise<SignUpOutput> {
    try {
      const normalizedEmail = email.trim().toLocaleLowerCase();
      const exists = await this.prismaService.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (exists) {
        return {
          ok: false,
          error: 'Email already exists.',
        };
      }
      const passwordHash = await argon2.hash(password);
      const user = await this.prismaService.user.create({
        data: { email: normalizedEmail, passwordHash, name: name.trim() },
      });

      const token = this.generateVerificationToken();
      const tokenHash = this.hashVerificationToken(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      await this.prismaService.emailVerification.upsert({
        where: { userId: user.id },
        update: {
          tokenHash,
          expiresAt,
        },
        create: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
      await this.mailsService.sendVerificationEmail(user.email, token);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create account',
      };
    }
  }

  async signIn(signInInput: SignInInput): Promise<SignInOutput> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email: signInInput.email },
        select: {
          id: true,
          passwordHash: true,
        },
      });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
          accessToken: null,
          refreshToken: null,
        };
      }
      const passwordMatches = await argon2.verify(
        user.passwordHash,
        signInInput.password,
      );
      if (!passwordMatches) {
        return {
          ok: false,
          error: 'Incorrect email or password.',
          accessToken: null,
          refreshToken: null,
        };
      }

      const sessionId = uuidv7();
      const refreshToken = await this.createRefreshToken(user.id, sessionId);
      const refreshTokenHash = await argon2.hash(refreshToken);

      await this.prismaService.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          refreshTokenHash,
          refreshExpiresAt: new Date(
            Date.now() + getRefreshTokenTtlMs(this.configService),
          ),
        },
      });
      const accessToken = await this.createAccessToken(user.id, sessionId);

      // const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      // const session = await this.prismaService.authSession.create({
      //   data: {
      //     userId: user.id,
      //     expiresAt,
      //   },
      //   select: {
      //     id: true,
      //   },
      // });
      // const accessToken = await this.jwtService.signAsync({
      //   sub: user.id,
      //   sid: session.id,
      // });

      return {
        ok: true,
        accessToken,
        refreshToken,
      };
    } catch {
      return {
        ok: false,
        error: 'Login Failed',
        accessToken: null,
      };
    }
  }

  async findById(id: string): Promise<UserProfileOutput> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        return {
          ok: false,
          error: 'User Not Found',
          user: null,
        };
      }
      return {
        ok: true,
        user: this.toPublicUser(user),
      };
    } catch {
      return {
        ok: false,
        error: 'User Not Found',
        user: null,
      };
    }
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async editProfile(
    userId: string,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const { password, email, ...profileData } = editProfileInput;
      const passwordHash = password ? await argon2.hash(password) : undefined;
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...profileData,
          ...(passwordHash && { passwordHash }),
          ...(email && {
            email: email.trim().toLocaleLowerCase(),
            verifiedAt: null,
          }),
        },
      });
      return {
        ok: true,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          ok: false,
          error: 'Email already exists.',
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return {
          ok: false,
          error: 'User not found.',
        };
      }

      return {
        ok: false,
        error: 'Could not update profile.',
      };
    }
  }

  async verifyEmail(token: string): Promise<VerifyEmailOutput> {
    try {
      const tokenHash = this.hashVerificationToken(token);
      const verification =
        await this.prismaService.emailVerification.findUnique({
          where: {
            tokenHash,
          },
          select: {
            id: true,
            userId: true,
            expiresAt: true,
          },
        });
      if (!verification) {
        return {
          ok: false,
          error: 'Verification Not Found',
        };
      }

      if (verification.expiresAt <= new Date()) {
        await this.prismaService.emailVerification.delete({
          where: { id: verification.id },
        });
        return {
          ok: false,
          error: 'Verfication token has expired.',
        };
      }

      await this.prismaService.$transaction([
        this.prismaService.user.update({
          where: {
            id: verification.userId,
          },
          data: {
            verifiedAt: new Date(),
          },
        }),
        this.prismaService.emailVerification.delete({
          where: {
            id: verification.id,
          },
        }),
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not verify email.',
      };
    }
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findUserByActiveSession(sessionId: string): Promise<User | null> {
    const session = await this.prismaService.authSession.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        refreshExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        user: true,
      },
    });
    return session?.user ?? null;
  }

  async signOut(sessionId: string): Promise<SignOutOutput> {
    try {
      await this.prismaService.authSession.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not sign out.',
      };
    }
  }

  async refreshAccessToken(
    refreshAccessTokenInput: RefreshAccessTokenInput,
  ): Promise<RefreshAccessTokenOutput> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshAccessTokenInput.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          algorithms: ['HS256'],
          issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
          audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
        },
      );

      if (
        payload.tokenType !== 'refresh' ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string'
      ) {
        return {
          ok: false,
          error: 'Invalid refresh token',
          accessToken: null,
          refreshToken: null,
        };
      }

      const now = new Date();
      const session = await this.prismaService.authSession.findUnique({
        where: {
          id: payload.sid,
        },
        select: {
          id: true,
          userId: true,
          refreshTokenHash: true,
          refreshExpiresAt: true,
          revokedAt: true,
        },
      });

      if (
        !session ||
        session.userId !== payload.sub ||
        session.revokedAt ||
        session.refreshExpiresAt <= now
      ) {
        return {
          ok: false,
          error: 'Session Invalid or Refresh session has expired',
          accessToken: null,
          refreshToken: null,
        };
      }

      const tokenMatches = await argon2.verify(
        session.refreshTokenHash,
        refreshAccessTokenInput.refreshToken,
      );
      // suspicious user action
      if (!tokenMatches) {
        await this.prismaService.authSession.updateMany({
          where: {
            id: session.id,
            revokedAt: null,
          },
          data: {
            revokedAt: now,
          },
        });
        return {
          ok: false,
          error: 'Refresh token has been revoked.',
          accessToken: null,
          refreshToken: null,
        };
      }

      const nextRefreshToken = await this.createRefreshToken(
        session.userId,
        session.id,
      );
      const nextRefreshTokenHash = await argon2.hash(nextRefreshToken);
      const updateRecord = await this.prismaService.authSession.updateMany({
        where: {
          id: session.id,
          userId: session.userId,
          refreshTokenHash: session.refreshTokenHash,
          revokedAt: null,
          refreshExpiresAt: {
            gt: now,
          },
        },
        data: {
          refreshTokenHash: nextRefreshTokenHash,
          refreshExpiresAt: new Date(
            Date.now() + getRefreshTokenTtlMs(this.configService),
          ),
          lastUsedAt: now,
        },
      });

      if (updateRecord.count !== 1) {
        return {
          ok: false,
          error: 'Refresh token was already used.',
          accessToken: null,
          refreshToken: null,
        };
      }

      const accessToken = await this.createAccessToken(
        session.userId,
        session.id,
      );
      return {
        ok: true,
        accessToken,
        refreshToken: nextRefreshToken,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not refresh access token.',
        accessToken: null,
        refreshToken: null,
      };
    }
  }

  private createAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      sid: sessionId,
      tokenType: 'access',
    });
  }

  private createRefreshToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        tokenType: 'refresh',
        jti: uuidv7(),
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        algorithm: 'HS256',
        expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
        issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
        audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
      },
    );
  }
}
