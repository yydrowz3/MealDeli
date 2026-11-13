import { CatalogQueryService } from './application/catalog-query.service';
import {
  AllCategoriesPayload,
  CategoryInput,
  CategoryPayload,
  SearchRestaurantInput,
  SearchRestaurantPayload,
} from './dto/category-query.dto';
import {
  RestaurantInput,
  RestaurantPayload,
  RestaurantsInput,
  RestaurantsPayload,
} from './dto/restaurant-query.dto';
import { DishModel } from './models/dish.model';
import { RestaurantModel } from './models/restaurant.model';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { UseGuards } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver(() => RestaurantModel)
export class CatalogQueryResolver {
  constructor(private readonly catalogQueries: CatalogQueryService) {}

  @Query(() => AllCategoriesPayload)
  async allCategories(): Promise<AllCategoriesPayload> {
    return {
      ok: true,
      categories: await this.catalogQueries.allCategories(),
    };
  }

  @Query(() => RestaurantsPayload)
  async restaurants(
    @Args('input') input: RestaurantsInput,
  ): Promise<RestaurantsPayload> {
    const page = await this.catalogQueries.restaurants(input.page);
    return { ok: true, ...page };
  }

  @Query(() => RestaurantPayload)
  async restaurant(
    @Args('input') input: RestaurantInput,
  ): Promise<RestaurantPayload> {
    const restaurant = await this.catalogQueries.restaurant(input.restaurantId);
    return restaurant
      ? { ok: true, restaurant }
      : {
          ok: false,
          error: 'Restaurant is unavailable.',
        };
  }

  @Query(() => CategoryPayload)
  async category(
    @Args('input') input: CategoryInput,
  ): Promise<CategoryPayload> {
    const result = await this.catalogQueries.category(input.slug, input.page);
    return result
      ? { ok: true, ...result }
      : {
          ok: false,
          error: 'Category is unavailable.',
          restaurants: [],
          totalResults: 0,
          totalPages: 0,
        };
  }

  @Query(() => SearchRestaurantPayload)
  async searchRestaurant(
    @Args('input') input: SearchRestaurantInput,
  ): Promise<SearchRestaurantPayload> {
    const page = await this.catalogQueries.searchRestaurant(
      input.query,
      input.page,
    );
    return {
      ok: true,
      restaurants: page.results,
      totalResults: page.totalResults,
      totalPages: page.totalPages,
    };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Query(() => RestaurantsPayload)
  async myRestaurants(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input', {
      type: () => RestaurantsInput,
      defaultValue: { page: 1 },
    })
    input: RestaurantsInput,
  ): Promise<RestaurantsPayload> {
    const page = await this.catalogQueries.myRestaurants(principal, input.page);
    return { ok: true, ...page };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Query(() => RestaurantPayload)
  async myRestaurant(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: RestaurantInput,
  ): Promise<RestaurantPayload> {
    const restaurant = await this.catalogQueries.myRestaurant(
      principal,
      input.restaurantId,
    );
    return restaurant
      ? { ok: true, restaurant }
      : {
          ok: false,
          error: 'Resource is unavailable.',
        };
  }

  @ResolveField(() => [DishModel])
  menu(@Parent() restaurant: RestaurantModel): Promise<DishModel[]> {
    return this.catalogQueries.menu(restaurant.id);
  }
}
