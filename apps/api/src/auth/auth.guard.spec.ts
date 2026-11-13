import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AccessTokenVerifier } from './access-token-verifier';
import { Roles } from './decorator/roles.decorator';
import { makeUser } from '../../test/fixtures';
import { UserRole } from '../users/enums/role.enum';

class Handlers {
  public(this: void) {
    return undefined;
  }
  @Roles('Any') authenticated(this: void) {
    return undefined;
  }
  @Roles(UserRole.OWNER) owner(this: void) {
    return undefined;
  }
}

describe('AuthGuard', () => {
  let verify: ReturnType<typeof vi.fn>;
  let guard: AuthGuard;
  beforeEach(() => {
    verify = vi
      .fn()
      .mockResolvedValue({ user: makeUser(), sessionId: 'session-id' });
    guard = new AuthGuard(new Reflector(), {
      verify,
    } as unknown as AccessTokenVerifier);
  });

  function context(handler: keyof Handlers, token: unknown = 'access-token') {
    const gql: { token: unknown; user?: unknown; sessionId?: string } = {
      token,
    };
    const args = [undefined, {}, gql, {}];
    return {
      gql,
      execution: {
        getHandler: () => Handlers.prototype[handler],
        getClass: () => Handlers,
        getType: () => 'graphql',
        getArgs: () => args,
        getArgByIndex: (index: number) => args[index],
      } as unknown as ExecutionContext,
    };
  }

  it('allows public handlers without verifying a token', async () => {
    await expect(guard.canActivate(context('public').execution)).resolves.toBe(
      true,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it.each(Object.values(UserRole))(
    'attaches the user and session for an authenticated %s',
    async (role) => {
      verify.mockResolvedValue({
        user: makeUser({ role }),
        sessionId: 'session-id',
      });
      const { gql, execution } = context('authenticated');
      await expect(guard.canActivate(execution)).resolves.toBe(true);
      expect(gql).toMatchObject({ user: { role }, sessionId: 'session-id' });
      expect(verify).toHaveBeenCalledWith('access-token');
    },
  );

  it.each([
    [UserRole.OWNER, true],
    [UserRole.CUSTOMER, false],
    [UserRole.COURIER, false],
  ])('checks owner role against %s', async (role, allowed) => {
    verify.mockResolvedValue({
      user: makeUser({ role }),
      sessionId: 'session-id',
    });
    await expect(guard.canActivate(context('owner').execution)).resolves.toBe(
      allowed,
    );
  });

  it('propagates invalid or expired session errors', async () => {
    verify.mockRejectedValue(new UnauthorizedException());
    await expect(
      guard.canActivate(context('authenticated').execution),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not pass a non-string token to the verifier', async () => {
    verify.mockRejectedValue(new UnauthorizedException());
    await expect(
      guard.canActivate(context('authenticated', {}).execution),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).toHaveBeenCalledWith(undefined);
  });
});
