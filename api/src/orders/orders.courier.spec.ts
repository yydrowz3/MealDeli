import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from './enums/status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService courier dispatch contract', () => {
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
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new OrdersService(
      { order: { findMany } } as unknown as PrismaService,
      { publish: jest.fn() } as unknown as PubSub,
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
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(order),
    };
    const transaction = jest.fn(async (callback) =>
      callback({ order: transactionOrder }),
    );
    const publish = jest.fn().mockResolvedValue(undefined);
    const service = new OrdersService(
      { $transaction: transaction } as unknown as PrismaService,
      { publish } as unknown as PubSub,
    );

    await expect(
      service.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({ ok: true });
    expect(transaction.mock.calls[0][1]).toEqual({
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
    const findUnique = jest.fn().mockResolvedValue(cooking);
    const update = jest.fn().mockResolvedValue(ready);
    const publish = jest.fn().mockResolvedValue(undefined);
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
    const activeTransaction = jest.fn(async (callback) =>
      callback({
        order: {
          findFirst: jest.fn().mockResolvedValue({ id: 'active-id' }),
          updateMany: jest.fn(),
        },
      }),
    );
    const service = new OrdersService(
      { $transaction: activeTransaction } as unknown as PrismaService,
      { publish: jest.fn() } as unknown as PubSub,
    );
    await expect(
      service.takeOrder(courier, { id: 'other-id' }),
    ).resolves.toEqual({
      ok: false,
      error: 'You already have an active delivery.',
    });

    const unavailableTransaction = jest.fn(async (callback) =>
      callback({
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      }),
    );
    const competing = new OrdersService(
      { $transaction: unavailableTransaction } as unknown as PrismaService,
      { publish: jest.fn() } as unknown as PubSub,
    );
    await expect(
      competing.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Order is no longer available.',
    });
  });

  it('retries one serialization conflict and does not roll back on publish failure', async () => {
    const conflict = Object.assign(new Error('serialization conflict'), {
      code: 'P2034',
    });
    const transactionOrder = {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(order),
    };
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce(async (callback) =>
        callback({ order: transactionOrder }),
      );
    const service = new OrdersService(
      { $transaction: transaction } as unknown as PrismaService,
      {
        publish: jest.fn().mockRejectedValue(new Error('pubsub unavailable')),
      } as unknown as PubSub,
    );

    await expect(
      service.takeOrder(courier, { id: 'order-id' }),
    ).resolves.toEqual({ ok: true });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('only completes an assigned PICKED order to DELIVERED', async () => {
    const findUnique = jest.fn().mockResolvedValue(order);
    const update = jest
      .fn()
      .mockResolvedValue({ ...order, status: OrderStatus.DELIVERED });
    const service = new OrdersService(
      { order: { findUnique, update } } as unknown as PrismaService,
      { publish: jest.fn().mockResolvedValue(undefined) } as unknown as PubSub,
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
