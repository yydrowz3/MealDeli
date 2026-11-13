import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { makeUser, testConfig } from '../../test/fixtures';

function mocks() {
  return {
    signUp: vi.fn<UsersService['signUp']>(),
    signIn: vi.fn<UsersService['signIn']>(),
    signOut: vi.fn<UsersService['signOut']>(),
    refreshAccessToken: vi.fn<UsersService['refreshAccessToken']>(),
    editProfile: vi.fn<UsersService['editProfile']>(),
    findById: vi.fn<UsersService['findById']>(),
    verifyEmail: vi.fn<UsersService['verifyEmail']>(),
    resendVerification: vi.fn<UsersService['resendVerification']>(),
  };
}

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let users: ReturnType<typeof mocks>;
  let cookie: ReturnType<typeof vi.fn>;
  let clearCookie: ReturnType<typeof vi.fn>;
  let res: Response;

  beforeEach(async () => {
    users = mocks();
    cookie = vi.fn();
    clearCookie = vi.fn();
    res = { cookie, clearCookie } as unknown as Response;
    const module = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: testConfig() },
      ],
    }).compile();
    resolver = module.get(UsersResolver);
    await module.close();
  });

  it('delegates sign-up and profile edits with the authenticated user ID', async () => {
    const input = {
      email: 'user@example.test',
      password: 'password',
      name: 'User',
    };
    users.signUp.mockResolvedValue({ ok: true });
    await expect(resolver.signUp(input)).resolves.toEqual({ ok: true });
    expect(users.signUp).toHaveBeenCalledWith(input);
    users.editProfile.mockResolvedValue({ ok: true });
    await expect(
      resolver.editProfile(makeUser(), { name: 'New' }),
    ).resolves.toEqual({ ok: true });
    expect(users.editProfile).toHaveBeenCalledWith('user-id', { name: 'New' });
  });

  it('sets an HttpOnly refresh cookie while omitting the refresh token from login output', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    users.signIn.mockResolvedValue({
      ok: true,
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const input = { email: 'user@example.test', password: 'password' };
    const result = await resolver.signIn(input, { res });
    expect(users.signIn).toHaveBeenCalledWith(input);
    expect(cookie).toHaveBeenCalledWith('meal_deli_refresh', 'refresh', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/graphql',
      maxAge: 86_400_000,
    });
    expect(result).toEqual({
      ok: true,
      error: undefined,
      accessToken: 'access',
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('does not set a cookie on login failure', async () => {
    users.signIn.mockResolvedValue({
      ok: false,
      error: 'Login Failed',
      accessToken: null,
    });
    await expect(
      resolver.signIn(
        { email: 'user@example.test', password: 'password' },
        { res },
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(cookie).not.toHaveBeenCalled();
  });

  it('revokes the current session and clears the refresh cookie on logout', async () => {
    users.signOut.mockResolvedValue({ ok: true });
    await expect(resolver.signOut('session-id', { res })).resolves.toEqual({
      ok: true,
    });
    expect(users.signOut).toHaveBeenCalledWith('session-id');
    expect(clearCookie).toHaveBeenCalledWith(
      'meal_deli_refresh',
      expect.objectContaining({ path: '/graphql', httpOnly: true }),
    );
  });

  function refresh(header?: string) {
    return resolver.refreshAccessToken({
      req: { headers: { cookie: header } },
      res,
    } as Parameters<UsersResolver['refreshAccessToken']>[0]);
  }

  it.each([undefined, 'other=value', 'meal_deli_refresh=%ZZ'])(
    'rejects absent or malformed refresh cookies',
    async (header) => {
      await expect(refresh(header)).resolves.toMatchObject({
        ok: false,
        error: 'Refresh token is required.',
      });
      expect(users.refreshAccessToken).not.toHaveBeenCalled();
    },
  );

  it('decodes the named refresh cookie and rotates it', async () => {
    users.refreshAccessToken.mockResolvedValue({
      ok: true,
      accessToken: 'access',
      refreshToken: 'next-refresh',
    });
    await expect(
      refresh('other=value; meal_deli_refresh=old%2Btoken'),
    ).resolves.toMatchObject({ ok: true, accessToken: 'access' });
    expect(users.refreshAccessToken).toHaveBeenCalledWith({
      refreshToken: 'old+token',
    });
    expect(cookie).toHaveBeenCalledWith(
      'meal_deli_refresh',
      'next-refresh',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('clears the cookie when the refresh session is rejected', async () => {
    users.refreshAccessToken.mockResolvedValue({
      ok: false,
      error: 'expired',
      accessToken: null,
      refreshToken: null,
    });
    await expect(refresh('meal_deli_refresh=expired')).resolves.toMatchObject({
      ok: false,
      error: 'expired',
    });
    expect(clearCookie).toHaveBeenCalledOnce();
    expect(cookie).not.toHaveBeenCalled();
  });
});
