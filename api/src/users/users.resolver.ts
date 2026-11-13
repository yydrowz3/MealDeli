import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserModel } from '@/users/models/user.model';
import { RegisterPayload } from '@/users/dto/register.payload';
import { RegisterInput } from '@/users/dto/register.input';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '@/auth/gql-throttler.guard';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { type AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { UpdateUserPayload } from '@/users/dto/update-user.payload';
import { ChangeEmailInput } from '@/users/dto/change-email.input';
import { ChangePasswordInput } from '@/users/dto/change-password.input';
import { VerifyEmailPayload } from '@/users/dto/verify-email.payload';
import { VerifyEmailInput } from '@/users/dto/verify-email.input';
import { ResendVerificationEmailPayload } from '@/users/dto/resend-verification-email.payload';
import { UserOperationError } from '@/users/users.service.types';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => RegisterPayload)
  async register(
    @Args('input') input: RegisterInput,
  ): Promise<RegisterPayload> {
    const result = await this.usersService.register({
      email: input.email,
      password: input.password,
      role: input.role,
    });
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: 'Unable to register with these details.' };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 30, ttl: 60_000 } })
  @Query(() => UserModel)
  async me(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): Promise<UserModel> {
    const user = await this.usersService.getCurrentUser(principal.userId);
    if (!user) {
      throw new UnauthorizedException('Authenticated account no longer exists');
    }
    return user;
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => UpdateUserPayload)
  async changeEmail(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: ChangeEmailInput,
  ): Promise<UpdateUserPayload> {
    const result = await this.usersService.changeEmail(principal.userId, {
      newEmail: input.newEmail,
      currentPassword: input.currentPassword,
    });
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: userErrorMessage(result.error) };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => UpdateUserPayload)
  async changePassword(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: ChangePasswordInput,
  ): Promise<UpdateUserPayload> {
    const result = await this.usersService.changePassword(principal.userId, {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: userErrorMessage(result.error) };
  }

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 10, ttl: 60_000 } })
  @Mutation(() => VerifyEmailPayload)
  async verifyEmail(
    @Args('input') input: VerifyEmailInput,
  ): Promise<VerifyEmailPayload> {
    const result = await this.usersService.verifyEmail({ token: input.token });
    return result.ok
      ? { ok: true, verified: true }
      : {
          ok: false,
          verified: false,
          error: userErrorMessage(result.error),
        };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 3, ttl: 60_000 } })
  @Mutation(() => ResendVerificationEmailPayload)
  async resendVerificationEmail(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): Promise<ResendVerificationEmailPayload> {
    const result = await this.usersService.resendVerificationEmail(
      principal.userId,
    );
    return result.ok
      ? { ok: true }
      : { ok: false, error: userErrorMessage(result.error) };
  }
}

function userErrorMessage(error: UserOperationError): string {
  switch (error) {
    case UserOperationError.EmailAlreadyInUse:
      return 'Unable to use that email address.';
    case UserOperationError.EmailUnchanged:
      return 'The new email must be different.';
    case UserOperationError.PasswordUnchanged:
      return 'The new password must be different.';
    case UserOperationError.InvalidCurrentPassword:
      return 'Current password is incorrect.';
    case UserOperationError.UserNotFound:
      return 'Account is unavailable.';
    case UserOperationError.ConcurrentModification:
      return 'The account changed during this request. Please retry.';
    case UserOperationError.InvalidOrExpiredVerification:
      return 'Verification token is invalid or expired.';
    case UserOperationError.VerificationDeliveryFailed:
      return 'Verification email could not be sent. Please retry later.';
  }
}
