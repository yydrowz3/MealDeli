import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailsService } from '../mails/mails.service';
import { Prisma } from '../generated/prisma/client';
import { makeUser, NOW, testConfig } from '../../test/fixtures';

vi.mock('argon2', () => ({ hash: vi.fn(), verify: vi.fn() }));

function createPrisma() {
  return {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    emailVerification: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrisma>;
  let jwt: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };
  let mails: { sendVerificationEmail: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    prisma = createPrisma();
    jwt = {
      signAsync: vi.fn().mockResolvedValue('signed-token'),
      verifyAsync: vi.fn(),
    };
    mails = {
      sendVerificationEmail: vi.fn().mockResolvedValue({ id: 'mail-id' }),
    };
    vi.mocked(argon2.hash).mockResolvedValue('hash');
    vi.mocked(argon2.verify).mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: ConfigService, useValue: testConfig() },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: MailsService, useValue: mails },
      ],
    }).compile();
    service = module.get(UsersService);
    await module.close();
  });

  it('normalizes sign-up details and stores a hash of the emailed verification token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeUser());
    await expect(
      service.signUp({
        email: ' USER@Example.test ',
        name: ' User ',
        password: 'password',
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.test' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'user@example.test', name: 'User', passwordHash: 'hash' },
    });
    const token = mails.sendVerificationEmail.mock.calls[0][1] as string;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(prisma.emailVerification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          userId: 'user-id',
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(NOW.getTime() + 3_600_000),
        },
      }),
    );
  });

  it('does not create or email an existing account', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser());
    await expect(
      service.signUp({
        email: 'user@example.test',
        name: 'User',
        password: 'password',
      }),
    ).resolves.toEqual({ ok: false, error: 'Email already exists.' });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(mails.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns a safe sign-up error on persistence failure', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('database secret'));
    await expect(
      service.signUp({
        email: 'user@example.test',
        name: 'User',
        password: 'password',
      }),
    ).resolves.toEqual({ ok: false, error: 'Could not create account' });
  });

  it('creates a hashed refresh session and returns both signed tokens on login', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser());
    jwt.signAsync
      .mockResolvedValueOnce('refresh-token')
      .mockResolvedValueOnce('access-token');
    await expect(
      service.signIn({ email: 'user@example.test', password: 'password' }),
    ).resolves.toEqual({
      ok: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(argon2.verify).toHaveBeenCalledWith('password-hash', 'password');
    expect(argon2.hash).toHaveBeenCalledWith('refresh-token');
    expect(prisma.authSession.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String) as string,
        userId: 'user-id',
        refreshTokenHash: 'hash',
        refreshExpiresAt: new Date(NOW.getTime() + 86_400_000),
      },
    });
    expect(jwt.signAsync).toHaveBeenLastCalledWith({
      sub: 'user-id',
      sid: expect.any(String) as string,
      tokenType: 'access',
    });
  });

  it.each([
    ['unknown user', null, true, 'User not found'],
    ['wrong password', makeUser(), false, 'Incorrect email or password.'],
  ])(
    'rejects login for %s without opening a session',
    async (_, user, matches, error) => {
      prisma.user.findUnique.mockResolvedValue(user);
      vi.mocked(argon2.verify).mockResolvedValue(matches);
      await expect(
        service.signIn({ email: 'user@example.test', password: 'password' }),
      ).resolves.toMatchObject({ ok: false, error, accessToken: null });
      expect(prisma.authSession.create).not.toHaveBeenCalled();
      expect(jwt.signAsync).not.toHaveBeenCalled();
    },
  );

  it('handles login persistence errors', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('offline'));
    await expect(
      service.signIn({ email: 'user@example.test', password: 'password' }),
    ).resolves.toMatchObject({ ok: false, error: 'Login Failed' });
  });

  it('returns a public profile without private account fields', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser());
    const result = await service.findById('user-id');
    expect(result).toMatchObject({
      ok: true,
      user: { id: 'user-id', name: 'Test User' },
    });
    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('reports a missing profile', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).resolves.toEqual({
      ok: false,
      error: 'User Not Found',
      user: null,
    });
  });

  it('normalizes a new email, clears verification, and hashes a changed password', async () => {
    await expect(
      service.editProfile('user-id', {
        email: ' NEW@example.test ',
        password: 'new-password',
        name: 'New',
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        email: 'new@example.test',
        passwordHash: 'hash',
        name: 'New',
        verifiedAt: null,
      },
    });
  });

  it.each([
    ['P2002', 'Email already exists.'],
    ['P2025', 'User not found.'],
  ])('maps profile error %s', async (code, error) => {
    prisma.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('database error', {
        code,
        clientVersion: 'test',
      }),
    );
    await expect(
      service.editProfile('user-id', { name: 'New' }),
    ).resolves.toEqual({ ok: false, error });
  });

  it('marks an email verified and removes the one-time token in a transaction', async () => {
    prisma.emailVerification.findUnique.mockResolvedValue({
      id: 'verification-id',
      userId: 'user-id',
      expiresAt: new Date(NOW.getTime() + 1),
    });
    await expect(service.verifyEmail('raw-token')).resolves.toEqual({
      ok: true,
    });
    expect(prisma.emailVerification.findUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: createHash('sha256').update('raw-token').digest('hex'),
      },
      select: { id: true, userId: true, expiresAt: true },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { verifiedAt: NOW },
    });
    expect(prisma.emailVerification.delete).toHaveBeenCalledWith({
      where: { id: 'verification-id' },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it.each([
    [null, 'Verification Not Found'],
    [
      { id: 'verification-id', expiresAt: NOW },
      'Verfication token has expired.',
    ],
  ])(
    'rejects an unavailable verification token',
    async (verification, error) => {
      prisma.emailVerification.findUnique.mockResolvedValue(verification);
      await expect(service.verifyEmail('token')).resolves.toEqual({
        ok: false,
        error,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('revokes only an active session on logout', async () => {
    await expect(service.signOut('session-id')).resolves.toEqual({ ok: true });
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-id', revokedAt: null },
      data: { revokedAt: NOW },
    });
  });

  it('returns a safe logout error', async () => {
    prisma.authSession.updateMany.mockRejectedValue(new Error('offline'));
    await expect(service.signOut('session-id')).resolves.toEqual({
      ok: false,
      error: 'Could not sign out.',
    });
  });

  it('loads users only from active non-expired sessions', async () => {
    prisma.authSession.findFirst.mockResolvedValue({ user: makeUser() });
    await expect(
      service.findUserByActiveSession('session-id'),
    ).resolves.toEqual(makeUser());
    expect(prisma.authSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'session-id',
        revokedAt: null,
        refreshExpiresAt: { gt: NOW },
      },
      select: { user: true },
    });
    prisma.authSession.findFirst.mockResolvedValue(null);
    await expect(
      service.findUserByActiveSession('missing'),
    ).resolves.toBeNull();
  });

  describe('refresh tokens', () => {
    beforeEach(() => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        sid: 'session-id',
        tokenType: 'refresh',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        refreshTokenHash: 'old-hash',
        revokedAt: null,
        refreshExpiresAt: new Date(NOW.getTime() + 1_000),
      });
      prisma.authSession.updateMany.mockResolvedValue({ count: 1 });
      jwt.signAsync
        .mockResolvedValueOnce('next-refresh')
        .mockResolvedValueOnce('next-access');
    });

    it('rotates using a conditional update and issues the next access token', async () => {
      await expect(
        service.refreshAccessToken({ refreshToken: 'old-refresh' }),
      ).resolves.toEqual({
        ok: true,
        refreshToken: 'next-refresh',
        accessToken: 'next-access',
      });
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-id',
          userId: 'user-id',
          refreshTokenHash: 'old-hash',
          revokedAt: null,
          refreshExpiresAt: { gt: NOW },
        },
        data: {
          refreshTokenHash: 'hash',
          refreshExpiresAt: new Date(NOW.getTime() + 86_400_000),
          lastUsedAt: NOW,
        },
      });
    });

    it('rejects a refresh token already consumed by another request', async () => {
      prisma.authSession.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.refreshAccessToken({ refreshToken: 'old-refresh' }),
      ).resolves.toMatchObject({
        ok: false,
        error: 'Refresh token was already used.',
        accessToken: null,
      });
      expect(jwt.signAsync).toHaveBeenCalledTimes(1);
    });

    it('revokes a session when its token hash does not match', async () => {
      vi.mocked(argon2.verify).mockResolvedValue(false);
      await expect(
        service.refreshAccessToken({ refreshToken: 'wrong-refresh' }),
      ).resolves.toMatchObject({
        ok: false,
        error: 'Refresh token has been revoked.',
      });
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-id', revokedAt: null },
        data: { revokedAt: NOW },
      });
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it.each([
      null,
      { userId: 'other' },
      { userId: 'user-id', revokedAt: NOW },
      { userId: 'user-id', refreshExpiresAt: NOW },
    ])(
      'rejects a missing, mismatched, revoked or expired session',
      async (session) => {
        prisma.authSession.findUnique.mockResolvedValue(session);
        await expect(
          service.refreshAccessToken({ refreshToken: 'refresh' }),
        ).resolves.toMatchObject({ ok: false, accessToken: null });
        expect(jwt.signAsync).not.toHaveBeenCalled();
      },
    );

    it.each([
      { tokenType: 'access', sub: 'user-id', sid: 'session-id' },
      { tokenType: 'refresh', sub: 123, sid: 'session-id' },
      { tokenType: 'refresh', sub: 'user-id' },
    ])('rejects malformed claims before reading a session', async (claims) => {
      jwt.verifyAsync.mockResolvedValue(claims);
      await expect(
        service.refreshAccessToken({ refreshToken: 'refresh' }),
      ).resolves.toMatchObject({ ok: false, error: 'Invalid refresh token' });
      expect(prisma.authSession.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an invalid signature', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
      await expect(
        service.refreshAccessToken({ refreshToken: 'invalid' }),
      ).resolves.toMatchObject({
        ok: false,
        error: 'Could not refresh access token.',
      });
      expect(prisma.authSession.updateMany).not.toHaveBeenCalled();
    });
  });
});
