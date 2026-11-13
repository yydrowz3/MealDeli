import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../prisma/prisma.service';
import { makeUser, testConfig } from '../../test/fixtures';

function mocks() {
  return {
    restaurant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dish: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prisma: ReturnType<typeof mocks>;
  beforeEach(async () => {
    prisma = mocks();
    const module = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: ConfigService,
          useValue: testConfig({ RESTAURANTS_PAGE_SIZE: 2 }),
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RestaurantsService);
    await module.close();
  });

  it('sets restaurant ownership from the authenticated user', async () => {
    const input = {
      name: 'Cafe',
      address: 'Street',
      categoryId: 'category-id',
    };
    prisma.restaurant.create.mockResolvedValue({ id: 'restaurant-id' });
    await expect(
      service.createRestaurant(makeUser(), input),
    ).resolves.toMatchObject({ ok: true });
    expect(prisma.restaurant.create).toHaveBeenCalledWith({
      data: { ...input, ownerId: 'user-id' },
    });
  });

  it.each([
    [null, 'Restaurant not found'],
    [{ ownerId: 'other' }, "You can't edit a restaurant that you don't own"],
  ])(
    'prevents editing a missing or unowned restaurant',
    async (restaurant, error) => {
      prisma.restaurant.findUnique.mockResolvedValue(restaurant);
      await expect(
        service.editRestaurant(makeUser(), {
          restaurantId: 'restaurant-id',
          name: 'New',
        }),
      ).resolves.toEqual({ ok: false, error });
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    },
  );

  it('allows an owner to edit and delete their restaurant', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ ownerId: 'user-id' });
    await expect(
      service.editRestaurant(makeUser(), {
        restaurantId: 'restaurant-id',
        name: 'New',
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.restaurant.update).toHaveBeenCalledWith({
      where: { id: 'restaurant-id' },
      data: { name: 'New', address: undefined, image: undefined },
    });
    await expect(
      service.deleteRestaurant(makeUser(), { restaurantId: 'restaurant-id' }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.restaurant.delete).toHaveBeenCalledWith({
      where: { id: 'restaurant-id' },
    });
  });

  it('prevents deleting someone else restaurant', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ ownerId: 'other' });
    await expect(
      service.deleteRestaurant(makeUser(), { restaurantId: 'restaurant-id' }),
    ).resolves.toMatchObject({ ok: false });
    expect(prisma.restaurant.delete).not.toHaveBeenCalled();
  });

  it('paginates with stable ordering and computes total pages', async () => {
    prisma.restaurant.findMany.mockResolvedValue([{ id: 'restaurant-id' }]);
    prisma.restaurant.count.mockResolvedValue(5);
    await expect(service.allRestaurants({ page: 2 })).resolves.toEqual({
      ok: true,
      restaurants: [{ id: 'restaurant-id' }],
      totalResults: 5,
      totalPages: 3,
    });
    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
      skip: 2,
      take: 2,
      orderBy: [
        { promotedUntil: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
  });

  it('handles empty pages', async () => {
    prisma.restaurant.findMany.mockResolvedValue([]);
    prisma.restaurant.count.mockResolvedValue(0);
    await expect(service.allRestaurants({ page: 1 })).resolves.toMatchObject({
      ok: true,
      restaurants: [],
      totalPages: 0,
    });
  });

  it('returns safe errors for query and write failures', async () => {
    prisma.restaurant.findMany.mockRejectedValue(new Error('secret'));
    await expect(service.allRestaurants({ page: 1 })).resolves.toEqual({
      ok: false,
      error: 'could not load restaurants',
    });
    prisma.restaurant.create.mockRejectedValue(new Error('secret'));
    await expect(
      service.createRestaurant(makeUser(), {
        name: 'Cafe',
        address: 'Street',
        categoryId: 'category-id',
      }),
    ).resolves.toMatchObject({ ok: false });
  });

  const dishInput = {
    restaurantId: 'restaurant-id',
    name: 'Pizza',
    priceMinor: 1000,
    description: 'Fresh',
  };
  it.each([null, { ownerId: 'other' }])(
    'prevents dish creation in a missing or unowned restaurant',
    async (restaurant) => {
      prisma.restaurant.findUnique.mockResolvedValue(restaurant);
      await expect(
        service.createDish(makeUser(), dishInput),
      ).resolves.toMatchObject({ ok: false });
      expect(prisma.dish.create).not.toHaveBeenCalled();
    },
  );

  it('creates dishes and assigns option and choice IDs', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ ownerId: 'user-id' });
    await expect(
      service.createDish(makeUser(), {
        ...dishInput,
        options: [
          {
            name: 'Size',
            minSelections: 1,
            maxSelections: 1,
            choices: [{ name: 'Large', extraMinor: 100 }],
          },
        ],
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.dish.create).toHaveBeenCalledWith({
      data: {
        ...dishInput,
        options: [
          {
            id: expect.any(String) as string,
            name: 'Size',
            minSelections: 1,
            maxSelections: 1,
            choices: [
              {
                id: expect.any(String) as string,
                name: 'Large',
                extraMinor: 100,
              },
            ],
          },
        ],
      },
    });
  });

  it('rejects inconsistent dish option limits without writing', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ ownerId: 'user-id' });
    await expect(
      service.createDish(makeUser(), {
        ...dishInput,
        options: [
          { name: 'Size', minSelections: 2, maxSelections: 1, choices: [] },
        ],
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Dish option selection limits are invalid.',
    });
    expect(prisma.dish.create).not.toHaveBeenCalled();
  });

  it.each([null, { restaurant: { ownerId: 'other' } }])(
    'prevents editing or deleting an unavailable dish',
    async (dish) => {
      prisma.dish.findUnique.mockResolvedValue(dish);
      await expect(
        service.editDish(makeUser(), { dishId: 'dish-id', name: 'New' }),
      ).resolves.toMatchObject({ ok: false });
      await expect(
        service.deleteDish(makeUser(), { dishId: 'dish-id' }),
      ).resolves.toMatchObject({ ok: false });
      expect(prisma.dish.update).not.toHaveBeenCalled();
      expect(prisma.dish.delete).not.toHaveBeenCalled();
    },
  );

  it('allows an owner to edit and delete their dish', async () => {
    prisma.dish.findUnique.mockResolvedValue({
      restaurant: { ownerId: 'user-id' },
    });
    await expect(
      service.editDish(makeUser(), { dishId: 'dish-id', name: 'New' }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.dish.update).toHaveBeenCalledWith({
      where: { id: 'dish-id' },
      data: { name: 'New' },
    });
    await expect(
      service.deleteDish(makeUser(), { dishId: 'dish-id' }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.dish.delete).toHaveBeenCalledWith({
      where: { id: 'dish-id' },
    });
  });
});
