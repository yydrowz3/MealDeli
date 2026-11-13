import { assertOwner } from './assert-owner';
import { parseCatalogInput } from './parse-catalog-input';
import { normalizeCategorySlug } from '../domain/category-name';
import { normalizeSearchQuery } from '../domain/catalog-text';
import { CategoryModel } from '../models/category.model';
import { DishModel } from '../models/dish.model';
import { RestaurantModel } from '../models/restaurant.model';
import { CatalogMapper } from '../persistence/catalog.mapper';
import { CatalogQueryRepository } from '../persistence/catalog-query.repository';
import { RestaurantRecord } from '../persistence/catalog.selects';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, type Clock } from '@/common/time/clock';
import { PageResult } from '@/common/pagination/page.types';
import { Inject, Injectable } from '@nestjs/common';

export interface CategoryPage {
  category: CategoryModel;
  restaurants: RestaurantModel[];
  totalResults: number;
  totalPages: number;
}

@Injectable()
export class CatalogQueryService {
  constructor(
    private readonly queries: CatalogQueryRepository,
    private readonly mapper: CatalogMapper,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async allCategories(): Promise<CategoryModel[]> {
    const categories = await this.queries.findCategories();
    return categories.map((category) => this.mapper.toCategory(category));
  }

  async restaurants(page: number): Promise<PageResult<RestaurantModel>> {
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.listRestaurants(page, evaluatedAt),
      evaluatedAt,
    );
  }

  async restaurant(restaurantId: string): Promise<RestaurantModel | null> {
    const evaluatedAt = this.clock.now();
    const restaurant = await this.queries.findRestaurantById(restaurantId);
    return restaurant
      ? this.mapper.toRestaurant(restaurant, evaluatedAt)
      : null;
  }

  async category(rawSlug: string, page: number): Promise<CategoryPage | null> {
    const slug = parseCatalogInput(() => normalizeCategorySlug(rawSlug));
    const category = await this.queries.findCategoryBySlug(slug);

    if (!category) {
      return null;
    }

    const evaluatedAt = this.clock.now();
    const restaurants = await this.queries.listRestaurantsByCategory(
      category.id,
      page,
      evaluatedAt,
    );
    const pageResult = this.mapRestaurantPage(restaurants, evaluatedAt);

    return {
      category: this.mapper.toCategory(category),
      restaurants: pageResult.results,
      totalResults: pageResult.totalResults,
      totalPages: pageResult.totalPages,
    };
  }

  async searchRestaurant(
    rawQuery: string,
    page: number,
  ): Promise<PageResult<RestaurantModel>> {
    const query = parseCatalogInput(() => normalizeSearchQuery(rawQuery));
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.searchRestaurants(query, page, evaluatedAt),
      evaluatedAt,
    );
  }

  async myRestaurants(
    principal: AuthenticatedPrincipal,
    page: number,
  ): Promise<PageResult<RestaurantModel>> {
    assertOwner(principal);
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.listOwnerRestaurants(
        principal.userId,
        page,
        evaluatedAt,
      ),
      evaluatedAt,
    );
  }

  async myRestaurant(
    principal: AuthenticatedPrincipal,
    restaurantId: string,
  ): Promise<RestaurantModel | null> {
    assertOwner(principal);
    const evaluatedAt = this.clock.now();
    const restaurant = await this.queries.findOwnerRestaurant(
      principal.userId,
      restaurantId,
    );
    return restaurant
      ? this.mapper.toRestaurant(restaurant, evaluatedAt)
      : null;
  }

  async menu(restaurantId: string): Promise<DishModel[]> {
    const dishes = await this.queries.findMenuByRestaurantId(restaurantId);
    return dishes.map((dish) => this.mapper.toDish(dish));
  }

  private mapRestaurantPage(
    page: PageResult<RestaurantRecord>,
    evaluatedAt: Date,
  ): PageResult<RestaurantModel> {
    return {
      ...page,
      results: page.results.map((restaurant) =>
        this.mapper.toRestaurant(restaurant, evaluatedAt),
      ),
    };
  }
}
