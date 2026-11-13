import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';
import { makeUser } from '../../test/fixtures';

describe('OrdersResolver', () => {
  let resolver: OrdersResolver;
  const createOrder = vi.fn<OrdersService['createOrder']>();
  const getOrder = vi.fn<OrdersService['getOrder']>();
  const takeOrder = vi.fn<OrdersService['takeOrder']>();
  const asyncIterableIterator = vi.fn();
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersResolver,
        {
          provide: OrdersService,
          useValue: { createOrder, getOrder, takeOrder },
        },
        { provide: PUB_SUB, useValue: { asyncIterableIterator } },
      ],
    }).compile();
    resolver = module.get(OrdersResolver);
    await module.close();
  });
  it('forwards the customer and item selection for order creation', async () => {
    const input = {
      restaurantId: 'restaurant-id',
      items: [{ dishId: 'dish-id', quantity: 1 }],
    };
    createOrder.mockResolvedValue({ ok: true, orderId: 'order-id' });
    await expect(resolver.createOrder(makeUser(), input)).resolves.toEqual({
      ok: true,
      orderId: 'order-id',
    });
    expect(createOrder).toHaveBeenCalledWith(makeUser(), input);
  });
  it('preserves authorization failures returned by the service', async () => {
    getOrder.mockResolvedValue({
      ok: false,
      error: 'Permission denied for this order',
    });
    await expect(
      resolver.getOrder(makeUser(), { id: 'order-id' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Permission denied for this order',
    });
    expect(getOrder).toHaveBeenCalledWith(makeUser(), { id: 'order-id' });
  });
  it('passes the authenticated courier to a claim', async () => {
    takeOrder.mockResolvedValue({
      ok: false,
      error: 'Order is no longer available.',
    });
    await expect(
      resolver.takeOrder(makeUser(), { id: 'order-id' }),
    ).resolves.toMatchObject({ ok: false });
    expect(takeOrder).toHaveBeenCalledWith(makeUser(), { id: 'order-id' });
  });
  it('subscribes to the matching event streams', () => {
    resolver.pendingOrders();
    resolver.cookedOrders();
    resolver.orderUpdates({ id: 'order-id' });
    expect(asyncIterableIterator.mock.calls).toEqual([
      [NEW_PENDING_ORDER],
      [NEW_COOKED_ORDER],
      [NEW_ORDER_UPDATE],
    ]);
  });
});
