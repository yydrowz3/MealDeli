import { Injectable } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { PasswordHasherService } from '@/auth/password-hasher.service';
import { AccessTokenService } from '@/auth/access-token.service';
import { toSafeUser } from '@/users/user.mapper';
import { normalizeEmail } from '@/users/normalize-email';
import { UserModel } from '@/users/models/user.model';

export interface LoginCommand {
  email: string;
  password: string;
}

export type LoginResult =
  | {
      ok: true;
      accessToken: string;
      expiresIn: number;
      user: UserModel;
    }
  | { ok: false };

@Injectable()
export class AuthService {
  constructor(
    private readonly credentials: CredentialsRepository,
    private readonly passwords: PasswordHasherService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async login(input: LoginCommand): Promise<LoginResult> {
    const user = await this.credentials.findByNormalizedEmail(
      normalizeEmail(input.email),
    );
    const passwordMatches = await this.passwords.verifyOrDummy(
      user?.passwordHash ?? null,
      input.password,
    );
    if (!user || !passwordMatches) {
      return { ok: false };
    }
    const safeUser = toSafeUser(user);
    const issued = await this.accessTokens.issue({
      userId: safeUser.id,
      role: safeUser.role,
    });
    return {
      ok: true,
      ...issued,
      user: safeUser,
    };
  }
}
