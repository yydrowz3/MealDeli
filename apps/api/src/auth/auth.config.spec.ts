import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { getRefreshTokenCookie, getRefreshTokenTtlMs } from './auth.config';

describe('refresh token configuration', () => {
  it('trims the cookie name and parses a positive safe integer TTL', () => {
    const config = new ConfigService({
      JWT_REFRESH_TOKEN_COOKIE: ' refresh ',
      JWT_REFRESH_TOKEN_TTL_MS: '86400000',
    });
    expect(getRefreshTokenCookie(config)).toBe('refresh');
    expect(getRefreshTokenTtlMs(config)).toBe(86_400_000);
  });
  it('rejects an empty cookie name', () => {
    expect(() =>
      getRefreshTokenCookie(
        new ConfigService({ JWT_REFRESH_TOKEN_COOKIE: ' ' }),
      ),
    ).toThrow('JWT_REFRESH_TOKEN_COOKIE must not be empty.');
  });
  it.each([
    '0',
    '-1',
    '1.5',
    'NaN',
    'Infinity',
    String(Number.MAX_SAFE_INTEGER + 1),
  ])('rejects invalid TTL %s', (ttl) => {
    expect(() =>
      getRefreshTokenTtlMs(
        new ConfigService({ JWT_REFRESH_TOKEN_TTL_MS: ttl }),
      ),
    ).toThrow('JWT_REFRESH_TOKEN_TTL_MS must be a positive integer.');
  });
});
