import { ConfigService } from '@nestjs/config';
import { UserRole } from '../src/users/enums/role.enum';
import type { User } from '../src/users/entities/user.entity';

export const NOW = new Date('2026-10-30T04:00:00.000Z');

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    email: 'user@example.test',
    passwordHash: 'password-hash',
    name: 'Test User',
    role: UserRole.CUSTOMER,
    address: null,
    image: null,
    verifiedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function testConfig(
  overrides: Record<string, unknown> = {},
): ConfigService {
  return new ConfigService({
    JWT_ISSUER: 'meal-deli-test',
    JWT_AUDIENCE: 'meal-deli-test-client',
    JWT_ACCESS_SECRET: 'test-only-access-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'test-only-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '1d',
    JWT_REFRESH_TOKEN_COOKIE: 'meal_deli_refresh',
    JWT_REFRESH_TOKEN_TTL_MS: '86400000',
    PUBLIC_ASSET_BASE_URL: 'https://assets.example.test',
    ...overrides,
  });
}
