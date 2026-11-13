import { escapeLikePattern } from '../domain/catalog-text';
import { PAGE_SIZE } from '@/common/pagination/page.constants';
import {
  PageResult,
  pageOffset,
  toPageResult,
} from '@/common/pagination/page.types';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  CATEGORY_SELECT,
  CategoryRecord,
  DISH_SELECT,
  DishRecord,
  RESTAURANT_SELECT,
  RestaurantRecord,
} from './catalog.selects';

@Injectable()
export class CatalogQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories(): Promise<CategoryRecord[]> {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: CATEGORY_SELECT,
    });
  }

  async listRestaurants(
    page: number,
    evaluatedAt: Date,
    where: Prisma.RestaurantWhereInput = {},
  ): Promise<PageResult<RestaurantRecord>> {
    const offset = pageOffset(page);

    return this.prisma.$transaction(
      async (transaction) => {
        const activeWhere: Prisma.RestaurantWhereInput = {
          AND: [where, { promotedUntil: { gt: evaluatedAt } }],
        };
        const inactiveWhere: Prisma.RestaurantWhereInput = {
          AND: [
            where,
            {
              OR: [
                { promotedUntil: null },
                { promotedUntil: { lte: evaluatedAt } },
              ],
            },
          ],
        };

        const totalResults = await transaction.restaurant.count({ where });
        const activeCount = await transaction.restaurant.count({
          where: activeWhere,
        });
        const activeTake = Math.max(
          0,
          Math.min(PAGE_SIZE, activeCount - offset),
        );
        const active =
          activeTake === 0
            ? []
            : await transaction.restaurant.findMany({
                where: activeWhere,
                select: RESTAURANT_SELECT,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: offset,
                take: activeTake,
              });

        const inactiveTake = PAGE_SIZE - active.length;
        const inactiveSkip = Math.max(0, offset - activeCount);
        const inactive =
          inactiveTake === 0
            ? []
            : await transaction.restaurant.findMany({
                where: inactiveWhere,
                select: RESTAURANT_SELECT,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: inactiveSkip,
                take: inactiveTake,
              });

        return toPageResult([...active, ...inactive], totalResults);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 2_000,
        timeout: 5_000,
      },
    );
  }

  listRestaurantsByCategory(
    categoryId: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, { categoryId });
  }

  searchRestaurants(
    normalizedQuery: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, {
      name: {
        contains: escapeLikePattern(normalizedQuery),
        mode: 'insensitive',
      },
    });
  }

  listOwnerRestaurants(
    ownerId: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, { ownerId });
  }

  findOwnerRestaurant(
    ownerId: string,
    restaurantId: string,
  ): Promise<RestaurantRecord | null> {
    return this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId,
      },
      select: RESTAURANT_SELECT,
    });
  }

  findRestaurantById(restaurantId: string): Promise<RestaurantRecord | null> {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: RESTAURANT_SELECT,
    });
  }

  async findMenuByRestaurantId(restaurantId: string): Promise<DishRecord[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        dishes: {
          select: DISH_SELECT,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return restaurant?.dishes ?? [];
  }
}
