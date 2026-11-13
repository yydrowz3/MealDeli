import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from './enums/status.enum';
import { OrdersService } from './orders.service';
import { Prisma } from '../generated/prisma/client';

type ClaimCallback = (transaction: { order: unknown }) => Promise<unknown>;

describe('OrdersService courier dispatch contract', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  const courier = { id: 'courier-id', role: UserRole.COURIER } as User;
  const order = {
    id: 'order-id',
    customerId: 'customer-id',
    restaurantId: 'restaurant-id',
    courierId: 'courier-id',
    status: OrderStatus.PICKED,
    totalMinor: 1200,
    createdAt: new Date('2026-08-17T10:00:00Z'),
    updatedAt: new Date('2026-08-17T10:00:00Z'),
    items: [],
    restaurant: { ownerId: 'owner-id' },
  };

  it('filters and deterministically sorts available orders', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new OrdersService(
      { order: { findMany } } as unknown as PrismaService,
      { publish: vi.fn() } as unknown as PubSub,
    );

    await expect(service.getAvailableOrders()).resolves.toEqual({
      ok: true,
      orders: [],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { status: OrderStatus.WAITING, courierId: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  });

  it('uses a Serializable active check and conditional claim before publishing', async () => {
    const transactionOrder = {
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: vi.fn().mockResolvedValue(order),
    };
    const transaction = vi.fn((callback: ClaimCallback) =>
      callback({ order: transactionOrder }),
    );
    const publish = vi.fn().mockResolvedValue(undefined);
    const service = new OrdersService(
      { $transaction: transaction } as unknown as PrismaService,
      { publish } as unknown as PubSub,
    );

    await expect(
      service.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({ ok: true });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(transactionOrder.findFirst).toHaveBeenCalledWith({
      where: {
        courierId: 'courier-id',
        status: { not: OrderStatus.DELIVERED },
      },
      select: { id: true },
    });
    expect(transactionOrder.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-id', status: OrderStatus.WAITING, courierId: null },
      data: { courierId: 'courier-id', status: OrderStatus.PICKED },
    });
    expect(publish).toHaveBeenCalledWith('NEW_ORDER_UPDATE', {
      orderUpdates: order,
    });
  });

  it('publishes an owner-ready order to the courier realtime stream', async () => {
    const cooking = { ...order, status: OrderStatus.COOKING, courierId: null };
    const ready = { ...cooking, status: OrderStatus.WAITING };
    const findUnique = vi.fn().mockResolvedValue(cooking);
    const update = vi.fn().mockResolvedValue(ready);
    const publish = vi.fn().mockResolvedValue(undefined);
    const service = new OrdersService(
      { order: { findUnique, update } } as unknown as PrismaService,
      { publish } as unknown as PubSub,
    );

    await expect(
      service.editOrder({ id: 'owner-id', role: UserRole.OWNER } as User, {
        id: 'order-id',
        status: OrderStatus.WAITING,
      }),
    ).resolves.toEqual({ ok: true });
    expect(publish).toHaveBeenNthCalledWith(1, 'NEW_COOKED_ORDER', {
      cookedOrders: ready,
    });
  });

  it('coordinates active and same-order conflicts without a second claim', async () => {
    const activeTransaction = vi.fn((callback: ClaimCallback) =>
      callback({
        order: {
          findFirst: vi.fn().mockResolvedValue({ id: 'active-id' }),
          updateMany: vi.fn(),
        },
      }),
    );
    const service = new OrdersService(
      { $transaction: activeTransaction } as unknown as PrismaService,
      { publish: vi.fn() } as unknown as PubSub,
    );
    await expect(
      service.takeOrder(courier, { id: 'other-id' }),
    ).resolves.toEqual({
      ok: false,
      error: 'You already have an active delivery.',
    });

    const unavailableTransaction = vi.fn((callback: ClaimCallback) =>
      callback({
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      }),
    );
    const competing = new OrdersService(
      { $transaction: unavailableTransaction } as unknown as PrismaService,
      { publish: vi.fn() } as unknown as PubSub,
    );
    await expect(
      competing.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Order is no longer available.',
    });
  });

  it('retries one serialization conflict and does not roll back on publish failure', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'serialization conflict',
      { code: 'P2034', clientVersion: 'test' },
    );
    const transactionOrder = {
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: vi.fn().mockResolvedValue(order),
    };
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce((callback: ClaimCallback) =>
        callback({ order: transactionOrder }),
      );
    const service = new OrdersService(
      { $transaction: transaction } as unknown as PrismaService,
      {
        publish: vi.fn().mockRejectedValue(new Error('pubsub unavailable')),
      } as unknown as PubSub,
    );

    await expect(
      service.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({ ok: true });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('only completes an assigned PICKED order to DELIVERED', async () => {
    const findUnique = vi.fn().mockResolvedValue(order);
    const update = vi
      .fn()
      .mockResolvedValue({ ...order, status: OrderStatus.DELIVERED });
    const service = new OrdersService(
      { order: { findUnique, update } } as unknown as PrismaService,
      { publish: vi.fn().mockResolvedValue(undefined) } as unknown as PubSub,
    );
    await expect(
      service.editOrder(courier, {
        id: 'order-id',
        status: OrderStatus.DELIVERED,
      }),
    ).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-id' },
        data: { status: OrderStatus.DELIVERED },
      }),
    );

    findUnique.mockResolvedValueOnce({
      ...order,
      courierId: 'another-courier',
    });
    await expect(
      service.editOrder(courier, {
        id: 'order-id',
        status: OrderStatus.DELIVERED,
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Permission denied for this order',
    });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
