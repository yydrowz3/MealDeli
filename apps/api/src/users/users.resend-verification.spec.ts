import { createHash } from 'node:crypto';
import { UsersService } from './users.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailsService } from '../mails/mails.service';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';

type TestUser = {
  id: string;
  email: string;
  verifiedAt: Date | null;
  emailVerification: { updatedAt: Date } | null;
};

describe('UsersService.resendVerification', () => {
  const createSubject = (user: TestUser | null) => {
    const findUnique = jest.fn().mockResolvedValue(user);
    const upsert = jest.fn().mockResolvedValue({});
    const sendVerificationEmail = jest.fn().mockResolvedValue({ id: 'mail-1' });
    const prisma = {
      user: { findUnique },
      emailVerification: { upsert },
    } as unknown as PrismaService;
    const mails = { sendVerificationEmail } as unknown as MailsService;
    const service = new UsersService(
      {} as ConfigService,
      prisma,
      {} as JwtService,
      mails,
    );

    return { service, findUnique, upsert, sendVerificationEmail };
  };

  it.each([
    ['unknown', null],
    [
      'verified',
      {
        id: 'user-1',
        email: 'known@example.test',
        verifiedAt: new Date(),
        emailVerification: null,
      },
    ],
  ] as const)('returns the same success for %s accounts', async (_, user) => {
    const subject = createSubject(user);

    await expect(
      subject.service.resendVerification('  KNOWN@example.test '),
    ).resolves.toEqual({ ok: true });
    expect(subject.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'known@example.test' } }),
    );
    expect(subject.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('silently applies the sixty second cooldown', async () => {
    const subject = createSubject({
      id: 'user-1',
      email: 'known@example.test',
      verifiedAt: null,
      emailVerification: { updatedAt: new Date(Date.now() - 59_000) },
    });

    await expect(
      subject.service.resendVerification('known@example.test'),
    ).resolves.toEqual({ ok: true });
    expect(subject.upsert).not.toHaveBeenCalled();
    expect(subject.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('stores only a SHA-256 hash with a one hour expiry and sends the raw token', async () => {
    const subject = createSubject({
      id: 'user-1',
      email: 'known@example.test',
      verifiedAt: null,
      emailVerification: { updatedAt: new Date(Date.now() - 61_000) },
    });
    const before = Date.now();

    await expect(
      subject.service.resendVerification('known@example.test'),
    ).resolves.toEqual({ ok: true });

    const sentToken = subject.sendVerificationEmail.mock.calls[0][1] as string;
    const data = subject.upsert.mock.calls[0][0].update as {
      tokenHash: string;
      expiresAt: Date;
    };
    expect(sentToken).toMatch(/^[a-f0-9]{64}$/);
    expect(data.tokenHash).toBe(
      createHash('sha256').update(sentToken).digest('hex'),
    );
    expect(data.tokenHash).not.toBe(sentToken);
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3_599_000);
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(before + 3_601_000);
  });

  it('returns a generic error when sending fails', async () => {
    const subject = createSubject({
      id: 'user-1',
      email: 'known@example.test',
      verifiedAt: null,
      emailVerification: null,
    });
    subject.sendVerificationEmail.mockRejectedValue(
      new Error('provider secret'),
    );

    await expect(
      subject.service.resendVerification('known@example.test'),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not resend verification email.',
    });
  });
});
