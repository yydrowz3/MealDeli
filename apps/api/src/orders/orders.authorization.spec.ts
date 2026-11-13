import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PubSub } from 'graphql-subscriptions';
import type { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { OrderStatus } from './enums/status.enum';
import { UserRole } from '../users/enums/role.enum';
import { makeUser, NOW } from '../../test/fixtures';

function mocks() {
  return {
    restaurant: { findUnique: vi.fn(), findMany: vi.fn() },
    dish: { findUnique: vi.fn() },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('OrdersService validation and authorization', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof mocks>;
  let publish: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    prisma = mocks();
    publish = vi.fn().mockResolvedValue(undefined);
    service = new OrdersService(
      prisma as unknown as PrismaService,
      { publish } as unknown as PubSub,
    );
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 'restaurant-id',
      ownerId: 'owner-id',
    });
    prisma.dish.findUnique.mockResolvedValue({
      id: 'dish-id',
      restaurantId: 'restaurant-id',
      name: 'Pizza',
      priceMinor: 1000,
      options: [
        {
          id: 'size',
          name: 'Size',
          minSelections: 1,
          maxSelections: 1,
          choices: [{ id: 'large', name: 'Large', extraMinor: 100 }],
        },
      ],
    });
  });

  it.each([
    [[], 'A required dish option is missing.'],
    [
      [
        { optionId: 'size', choiceIds: ['large'] },
        { optionId: 'size', choiceIds: ['large'] },
      ],
      'Each dish option can only be selected once.',
    ],
    [
      [
        { optionId: 'size', choiceIds: ['large'] },
        { optionId: 'unknown', choiceIds: ['large'] },
      ],
      'Dish option not found.',
    ],
    [
      [{ optionId: 'size', choiceIds: [] }],
      'Invalid number of choices for dish option.',
    ],
    [
      [{ optionId: 'size', choiceIds: ['large', 'large'] }],
      'Invalid number of choices for dish option.',
    ],
    [
      [{ optionId: 'size', choiceIds: ['unknown'] }],
      'Dish option choice not found.',
    ],
  ])(
    'rejects invalid option selection without writes or events',
    async (options, error) => {
      await expect(
        service.createOrder(makeUser(), {
          restaurantId: 'restaurant-id',
          items: [{ dishId: 'dish-id', quantity: 1, options }],
        }),
      ).resolves.toEqual({ ok: false, error });
      expect(prisma.order.create).not.toHaveBeenCalled();
      expect(publish).not.toHaveBeenCalled();
    },
  );

  it('rejects an empty order before reading dishes', async () => {
    await expect(
      service.createOrder(makeUser(), {
        restaurantId: 'restaurant-id',
        items: [],
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Order must contain at least one item.',
    });
    expect(prisma.dish.findUnique).not.toHaveBeenCalled();
    expect(prisma.order.create).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('does not publish when persistence fails', async () => {
    prisma.order.create.mockRejectedValue(new Error('offline'));
    await expect(
      service.createOrder(makeUser(), {
        restaurantId: 'restaurant-id',
        items: [
          {
            dishId: 'dish-id',
            quantity: 1,
            options: [{ optionId: 'size', choiceIds: ['large'] }],
          },
        ],
      }),
    ).resolves.toEqual({ ok: false, error: 'Could not create order.' });
    expect(publish).not.toHaveBeenCalled();
  });

  const order = {
    id: 'order-id',
    restaurantId: 'restaurant-id',
    customerId: 'customer-id',
    courierId: 'courier-id',
    restaurant: { ownerId: 'owner-id' },
    status: OrderStatus.PENDING,
    totalMinor: 1000,
    createdAt: NOW,
    updatedAt: NOW,
  };
  it.each([
    [UserRole.CUSTOMER, 'customer-id'],
    [UserRole.OWNER, 'owner-id'],
    [UserRole.COURIER, 'courier-id'],
  ])('allows the related %s to read an order', async (role, id) => {
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(
      service.getOrder(makeUser({ role, id }), { id: 'order-id' }),
    ).resolves.toMatchObject({ ok: true, order: { id: 'order-id' } });
  });

  it.each(Object.values(UserRole))(
    'rejects an unrelated %s reading or updating an order',
    async (role) => {
      prisma.order.findUnique.mockResolvedValue(order);
      const user = makeUser({ role, id: 'unrelated' });
      await expect(service.getOrder(user, { id: 'order-id' })).resolves.toEqual(
        { ok: false, error: 'Permission denied for this order' },
      );
      await expect(
        service.editOrder(user, {
          id: 'order-id',
          status: OrderStatus.COOKING,
        }),
      ).resolves.toMatchObject({ ok: false });
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(publish).not.toHaveBeenCalled();
    },
  );

  it('reports missing orders', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(
      service.getOrder(makeUser(), { id: 'missing' }),
    ).resolves.toEqual({ ok: false, error: 'Order Not Found' });
  });

  it('rejects skipped status transitions without writing or publishing', async () => {
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(
      service.editOrder(makeUser({ role: UserRole.OWNER, id: 'owner-id' }), {
        id: 'order-id',
        status: OrderStatus.WAITING,
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid order status transition.',
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it.each([
    [UserRole.CUSTOMER, 'customerId'],
    [UserRole.COURIER, 'courierId'],
  ])('filters %s order queries by current user', async (role, key) => {
    prisma.order.findMany.mockResolvedValue([]);
    await expect(
      service.getOrders(makeUser({ role }), { status: OrderStatus.PENDING }),
    ).resolves.toEqual({ ok: true, orders: [] });
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { [key]: 'user-id', status: OrderStatus.PENDING },
    });
  });
});
