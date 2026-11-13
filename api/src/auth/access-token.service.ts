import type {
  AuthenticatedPrincipal,
  AuthenticatedSession,
} from '@/auth/auth-principal';
import { EnvironmentVariables } from '@/config/environment.variables';
import { UserRole } from '@/users/user-role.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';

interface AccessTokenPayload extends Record<string, unknown> {
  sub: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async issue(principal: AuthenticatedPrincipal): Promise<IssuedAccessToken> {
    const expiresIn = this.config.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    const accessToken = await this.jwt.signAsync(
      { role: principal.role },
      {
        algorithm: 'HS256',
        subject: principal.userId,
        expiresIn,
        issuer: this.config.get('JWT_ISSUER', { infer: true }),
        audience: this.config.get('JWT_AUDIENCE', { infer: true }),
      },
    );

    return { accessToken, expiresIn };
  }

  async verify(accessToken: string): Promise<AuthenticatedPrincipal> {
    return (await this.verifySession(accessToken)).principal;
  }

  async verifySession(accessToken: string): Promise<AuthenticatedSession> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(
        accessToken,
        {
          algorithms: ['HS256'],
          issuer: this.config.get('JWT_ISSUER', { infer: true }),
          audience: this.config.get('JWT_AUDIENCE', { infer: true }),
        },
      );

      if (
        !isUUID(payload.sub, '7') ||
        !isUserRole(payload.role) ||
        !Number.isSafeInteger(payload.iat) ||
        !Number.isSafeInteger(payload.exp) ||
        payload.exp <= Math.floor(Date.now() / 1_000)
      ) {
        throw new UnauthorizedException('Invalid or expired access token.');
      }

      return {
        principal: {
          userId: payload.sub,
          role: payload.role,
        },
        expiresAtEpochSeconds: payload.exp,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}

function isUserRole(value: unknown): value is UserRole {
  return Object.values(UserRole).some((role) => role === value);
}
