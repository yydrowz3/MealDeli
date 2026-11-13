import { PasswordHasherService } from '@/auth/password-hasher.service';
import { normalizeEmail } from '@/users/normalize-email';
import {
  ChangeEmailCommand,
  ChangePasswordCommand,
  RegisterCommand,
  toPrismaUserRole,
  toSafeUser,
  VerifyEmailCommand,
} from '@/users/user.mapper';
import { SafeUser } from '@/users/user.types';
import { UsersRepository } from '@/users/users.repository';
import {
  EmptyUserOperationResult,
  UserMutationResult,
  UserOperationError,
} from '@/users/users.service.types';
import {
  VERIFICATION_MAILER,
  type VerificationMailer,
} from '@/users/verification-mailer.port';
import { VerificationTokenService } from '@/users/verification-token.service';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordHasherService,
    private readonly verificationTokens: VerificationTokenService,
    @Inject(VERIFICATION_MAILER)
    private readonly verificationMailer: VerificationMailer,
  ) {}

  async register(input: RegisterCommand): Promise<UserMutationResult> {
    const email = normalizeEmail(input.email);
    const passwordHash = await this.passwords.hash(input.password);
    const verification = this.verificationTokens.issue();

    try {
      const created = await this.users.createWithVerification({
        email,
        passwordHash,
        role: toPrismaUserRole(input.role),
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      });

      await this.sendVerificationAfterCommit(
        email,
        verification.rawToken,
        verification.tokenHash,
        'registration',
      );

      return { ok: true, value: toSafeUser(created) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: UserOperationError.EmailAlreadyInUse,
        };
      }
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<SafeUser | null> {
    const user = await this.users.findSafeById(userId);
    return user ? toSafeUser(user) : null;
  }

  async changeEmail(
    userId: string,
    input: ChangeEmailCommand,
  ): Promise<UserMutationResult> {
    const current = await this.users.findCredentialsById(userId);
    if (!current) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    const passwordMatches = await this.passwords.verify(
      current.passwordHash,
      input.currentPassword,
    );
    if (!passwordMatches) {
      return {
        ok: false,
        error: UserOperationError.InvalidCurrentPassword,
      };
    }

    const email = normalizeEmail(input.newEmail);
    if (email === current.email) {
      return { ok: false, error: UserOperationError.EmailUnchanged };
    }

    const verification = this.verificationTokens.issue();

    try {
      const updated = await this.users.updateEmailWithVerification({
        userId,
        expectedUpdatedAt: current.updatedAt,
        email,
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      });

      await this.sendVerificationAfterCommit(
        email,
        verification.rawToken,
        verification.tokenHash,
        'email change',
      );

      return { ok: true, value: toSafeUser(updated) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: UserOperationError.EmailAlreadyInUse,
        };
      }
      if (hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: UserOperationError.ConcurrentModification,
        };
      }
      throw error;
    }
  }

  async changePassword(
    userId: string,
    input: ChangePasswordCommand,
  ): Promise<UserMutationResult> {
    const current = await this.users.findCredentialsById(userId);
    if (!current) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    const passwordMatches = await this.passwords.verify(
      current.passwordHash,
      input.currentPassword,
    );
    if (!passwordMatches) {
      return {
        ok: false,
        error: UserOperationError.InvalidCurrentPassword,
      };
    }

    if (await this.passwords.verify(current.passwordHash, input.newPassword)) {
      return { ok: false, error: UserOperationError.PasswordUnchanged };
    }

    const passwordHash = await this.passwords.hash(input.newPassword);

    try {
      const updated = await this.users.updatePassword({
        userId,
        expectedUpdatedAt: current.updatedAt,
        passwordHash,
      });
      return { ok: true, value: toSafeUser(updated) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: UserOperationError.ConcurrentModification,
        };
      }
      throw error;
    }
  }

  async verifyEmail(
    input: VerifyEmailCommand,
  ): Promise<EmptyUserOperationResult> {
    const tokenHash = this.verificationTokens.hash(input.token);
    const verified = await this.users.consumeVerification(
      tokenHash,
      new Date(),
    );

    if (!verified) {
      return {
        ok: false,
        error: UserOperationError.InvalidOrExpiredVerification,
      };
    }

    return { ok: true, value: undefined };
  }

  async resendVerificationEmail(
    userId: string,
  ): Promise<EmptyUserOperationResult> {
    const existing = await this.users.findSafeById(userId);
    if (!existing) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    if (existing.verifiedAt !== null) {
      return { ok: true, value: undefined };
    }

    const verification = this.verificationTokens.issue();
    await this.users.replaceVerification({
      userId,
      tokenHash: verification.tokenHash,
      expiresAt: verification.expiresAt,
    });

    try {
      await this.verificationMailer.send({
        recipientEmail: existing.email,
        rawToken: verification.rawToken,
        deliveryKey: verificationDeliveryKey(verification.tokenHash),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      this.logger.error(
        'Verification email resend failed after token rotation',
        error instanceof Error ? error.stack : undefined,
      );
      return {
        ok: false,
        error: UserOperationError.VerificationDeliveryFailed,
      };
    }
  }

  private async sendVerificationAfterCommit(
    recipientEmail: string,
    rawToken: string,
    tokenHash: string,
    operation: string,
  ): Promise<void> {
    try {
      await this.verificationMailer.send({
        recipientEmail,
        rawToken,
        deliveryKey: verificationDeliveryKey(tokenHash),
      });
    } catch (error) {
      this.logger.error(
        `Verification email delivery failed after ${operation}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

function verificationDeliveryKey(tokenHash: string): string {
  return `email-verification/${tokenHash}`;
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
