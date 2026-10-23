import { ConfigService } from '@nestjs/config';

export function getRefreshTokenCookie(configService: ConfigService): string {
  const cookieName = configService
    .getOrThrow<string>('JWT_REFRESH_TOKEN_COOKIE')
    .trim();

  if (!cookieName) {
    throw new Error('JWT_REFRESH_TOKEN_COOKIE must not be empty.');
  }

  return cookieName;
}

export function getRefreshTokenTtlMs(configService: ConfigService): number {
  const value = configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL_MS');
  const ttlMs = Number(value);

  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
    throw new Error('JWT_REFRESH_TOKEN_TTL_MS must be a positive integer.');
  }

  return ttlMs;
}
