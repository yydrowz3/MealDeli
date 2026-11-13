import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { RestaurantsResolver } from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';
import { makeUser } from '../../test/fixtures';

describe('RestaurantsResolver', () => {
  let resolver: RestaurantsResolver;
  const createRestaurant = vi.fn<RestaurantsService['createRestaurant']>();
  const myRestaurants = vi.fn<RestaurantsService['myRestaurants']>();
  const allRestaurants = vi.fn<RestaurantsService['allRestaurants']>();
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantsResolver,
        {
          provide: RestaurantsService,
          useValue: { createRestaurant, myRestaurants, allRestaurants },
        },
      ],
    }).compile();
    resolver = module.get(RestaurantsResolver);
    await module.close();
  });
  it('passes the authenticated owner and input to restaurant creation', async () => {
    const input = {
      name: 'Cafe',
      address: 'Street',
      categoryId: 'category-id',
    };
    createRestaurant.mockResolvedValue({
      ok: false,
      error: 'Could not create restaurant',
      restaurantId: null,
    });
    await expect(
      resolver.createRestaurant(makeUser(), input),
    ).resolves.toMatchObject({ ok: false });
    expect(createRestaurant).toHaveBeenCalledWith(makeUser(), input);
  });
  it('passes the current owner to their restaurant query', async () => {
    myRestaurants.mockResolvedValue({ ok: true, restaurants: [] });
    await expect(resolver.myRestaurants(makeUser())).resolves.toEqual({
      ok: true,
      restaurants: [],
    });
    expect(myRestaurants).toHaveBeenCalledWith(makeUser());
  });
  it('preserves the public pagination input', async () => {
    allRestaurants.mockResolvedValue({
      ok: true,
      restaurants: [],
      totalPages: 0,
      totalResults: 0,
    });
    await expect(resolver.restaurants({ page: 2 })).resolves.toMatchObject({
      ok: true,
    });
    expect(allRestaurants).toHaveBeenCalledWith({ page: 2 });
  });
});
