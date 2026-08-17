import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

jest.mock('../users/users.service', () => ({ UsersService: class {} }));

import { AccessTokenVerifier } from './access-token-verifier';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/role.enum';
import type { User } from '../users/entities/user.entity';

function user(role: UserRole): User {
  return {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'not-exposed',
    name: 'User',
    address: null,
    image: null,
    role,
    verifiedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

describe('AccessTokenVerifier', () => {
  it.each([UserRole.CUSTOMER, UserRole.OWNER, UserRole.COURIER])(
    'allows an active %s session',
    async (role) => {
      const jwt = {
        verifyAsync: jest.fn().mockResolvedValue({
          sub: 'user-id',
          sid: 'session-id',
          tokenType: 'access',
        }),
      } as unknown as JwtService;
      const users = {
        findUserByActiveSession: jest.fn().mockResolvedValue(user(role)),
      } as unknown as UsersService;

      await expect(
        new AccessTokenVerifier(jwt, users).verify('token'),
      ).resolves.toMatchObject({
        user: { role },
        sessionId: 'session-id',
      });
    },
  );

  it.each([
    ['missing', undefined, undefined],
    ['invalid', 'token', new Error('expired')],
  ])('rejects a %s token', async (_label, token, verificationError) => {
    const jwt = {
      verifyAsync: verificationError
        ? jest.fn().mockRejectedValue(verificationError)
        : jest.fn(),
    } as unknown as JwtService;
    const users = {} as UsersService;
    await expect(
      new AccessTokenVerifier(jwt, users).verify(token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects revoked or expired sessions', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-id',
        sid: 'session-id',
        tokenType: 'access',
      }),
    } as unknown as JwtService;
    const users = {
      findUserByActiveSession: jest.fn().mockResolvedValue(null),
    } as unknown as UsersService;
    await expect(
      new AccessTokenVerifier(jwt, users).verify('token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh tokens at the REST boundary', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-id',
        sid: 'session-id',
        tokenType: 'refresh',
      }),
    } as unknown as JwtService;
    await expect(
      new AccessTokenVerifier(jwt, {} as UsersService).verify('token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
