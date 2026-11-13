import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { makeUser, NOW, testConfig } from '../../test/fixtures';

function mocks() {
  const transaction = {
    payment: { create: vi.fn() },
    restaurant: { update: vi.fn() },
  };
  return {
    transaction,
    restaurant: { findUnique: vi.fn() },
    payment: { findMany: vi.fn() },
    $transaction: vi.fn(
      async (callback: (tx: typeof transaction) => Promise<void>) =>
        callback(transaction),
    ),
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof mocks>;
  const input = {
    restaurantId: 'restaurant-id',
    transactionId: 'transaction-id',
  };
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    prisma = mocks();
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 'restaurant-id',
      ownerId: 'user-id',
    });
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: testConfig() },
      ],
    }).compile();
    service = module.get(PaymentsService);
    await module.close();
  });

  it('records the transaction and a seven day promotion together', async () => {
    await expect(service.createPayment(makeUser(), input)).resolves.toEqual({
      ok: true,
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.transaction.payment.create).toHaveBeenCalledWith({
      data: {
        transactionId: 'transaction-id',
        ownerId: 'user-id',
        restaurantId: 'restaurant-id',
      },
    });
    expect(prisma.transaction.restaurant.update).toHaveBeenCalledWith({
      where: { id: 'restaurant-id' },
      data: { promotedUntil: new Date('2026-11-06T04:00:00Z') },
    });
  });

  it.each([
    [null, 'Restaurant not found'],
    [{ ownerId: 'other' }, 'Permission denied from restaurant.'],
  ])(
    'rejects missing or unowned restaurants before a transaction',
    async (restaurant, error) => {
      prisma.restaurant.findUnique.mockResolvedValue(restaurant);
      await expect(service.createPayment(makeUser(), input)).resolves.toEqual({
        ok: false,
        error,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('maps a real Prisma duplicate transaction error and does not extend the promotion', async () => {
    prisma.transaction.payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(service.createPayment(makeUser(), input)).resolves.toEqual({
      ok: false,
      error: 'This transaction has already been processed.',
    });
    expect(prisma.transaction.restaurant.update).not.toHaveBeenCalled();
  });

  it('returns a safe error for failed transactions', async () => {
    prisma.transaction.restaurant.update.mockRejectedValue(
      new Error('database secret'),
    );
    await expect(service.createPayment(makeUser(), input)).resolves.toEqual({
      ok: false,
      error: 'Could not create payment',
    });
  });

  it('restricts payment history to the authenticated owner', async () => {
    prisma.payment.findMany.mockResolvedValue([]);
    await expect(service.getPayments(makeUser())).resolves.toEqual({
      ok: true,
      payments: [],
    });
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-id' },
    });
  });

  it('handles history persistence errors', async () => {
    prisma.payment.findMany.mockRejectedValue(new Error('offline'));
    await expect(service.getPayments(makeUser())).resolves.toEqual({
      ok: false,
      error: 'Could not get payments',
    });
  });
});
