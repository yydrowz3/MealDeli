import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  const restaurantFindUnique = jest.fn();
  const dishFindUnique = jest.fn();
  const orderCreate = jest.fn();
  const publish = jest.fn();

  const customer = { id: 'customer-id' } as User;
  const createOrderInput = {
    restaurantId: 'restaurant-id',
    items: [
      {
        dishId: 'dish-id',
        quantity: 2,
        options: [
          { optionId: 'extra-cheese', choiceIds: ['cheese'] },
          { optionId: 'size', choiceIds: ['large'] },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new OrdersService(
      {
        restaurant: { findUnique: restaurantFindUnique },
        dish: { findUnique: dishFindUnique },
        order: { create: orderCreate },
      } as unknown as PrismaService,
      { publish } as unknown as PubSub,
    );
  });

  it('creates price snapshots and publishes the pending order', async () => {
    restaurantFindUnique.mockResolvedValue({
      id: 'restaurant-id',
      ownerId: 'owner-id',
    });
    dishFindUnique.mockResolvedValue({
      id: 'dish-id',
      restaurantId: 'restaurant-id',
      name: 'Pizza',
      priceMinor: 1_000,
      options: [
        {
          id: 'extra-cheese',
          name: 'Extra cheese',
          minSelections: 0,
          maxSelections: 1,
          choices: [{ id: 'cheese', name: 'Extra cheese', extraMinor: 150 }],
        },
        {
          id: 'size',
          name: 'Size',
          minSelections: 1,
          maxSelections: 1,
          choices: [
            { id: 'large', name: 'Large', extraMinor: 200 },
            { id: 'small', name: 'Small', extraMinor: 0 },
          ],
        },
      ],
    });
    orderCreate.mockResolvedValue({ id: 'order-id', items: [] });

    await expect(
      service.createOrder(customer, createOrderInput),
    ).resolves.toEqual({
      ok: true,
      orderId: 'order-id',
    });

    expect(orderCreate).toHaveBeenCalledWith({
      data: {
        customerId: 'customer-id',
        restaurantId: 'restaurant-id',
        totalMinor: 2_700,
        items: {
          create: [
            {
              position: 0,
              dishId: 'dish-id',
              dishName: 'Pizza',
              basePriceMinor: 1_000,
              selectedOptions: [
                {
                  optionId: 'extra-cheese',
                  name: 'Extra cheese',
                  choices: [
                    {
                      choiceId: 'cheese',
                      name: 'Extra cheese',
                      extraMinor: 150,
                    },
                  ],
                },
                {
                  optionId: 'size',
                  name: 'Size',
                  choices: [
                    {
                      choiceId: 'large',
                      name: 'Large',
                      extraMinor: 200,
                    },
                  ],
                },
              ],
              optionsExtraMinor: 350,
              quantity: 2,
              lineTotalMinor: 2_700,
            },
          ],
        },
      },
      include: { items: true },
    });
    expect(publish).toHaveBeenCalledWith('NEW_PENDING_ORDER', {
      pendingOrders: {
        order: { id: 'order-id', items: [] },
        ownerId: 'owner-id',
      },
    });
  });

  it('creates an order when a dish has no selected options', async () => {
    restaurantFindUnique.mockResolvedValue({
      id: 'restaurant-id',
      ownerId: 'owner-id',
    });
    dishFindUnique.mockResolvedValue({
      id: 'dish-id',
      restaurantId: 'restaurant-id',
      name: 'Pizza',
      priceMinor: 1_000,
      options: [],
    });
    orderCreate.mockResolvedValue({ id: 'order-id', items: [] });

    await expect(
      service.createOrder(customer, {
        restaurantId: 'restaurant-id',
        items: [{ dishId: 'dish-id', quantity: 2 }],
      }),
    ).resolves.toEqual({
      ok: true,
      orderId: 'order-id',
    });

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalMinor: 2_000,
          items: {
            create: [
              expect.objectContaining({
                selectedOptions: [],
                optionsExtraMinor: 0,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('rejects a dish from another restaurant before creating an order', async () => {
    restaurantFindUnique.mockResolvedValue({
      id: 'restaurant-id',
      ownerId: 'owner-id',
    });
    dishFindUnique.mockResolvedValue({
      id: 'dish-id',
      restaurantId: 'another-restaurant-id',
    });

    await expect(
      service.createOrder(customer, createOrderInput),
    ).resolves.toEqual({
      ok: false,
      error: 'Dish does not belong to this restaurant.',
    });
    expect(orderCreate).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('returns a not-found response when the restaurant is missing', async () => {
    restaurantFindUnique.mockResolvedValue(null);

    await expect(
      service.createOrder(customer, createOrderInput),
    ).resolves.toEqual({
      ok: false,
      error: 'Restaurant not found.',
    });
    expect(dishFindUnique).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
  });
});
