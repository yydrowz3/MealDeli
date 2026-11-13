import { NormalizedCategoryName } from '../domain/category-name';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RESTAURANT_SELECT, RestaurantRecord } from './catalog.selects';

export interface CreateRestaurantRecord {
  ownerId: string;
  name: string;
  address: string;
  coverImageUrl: string;
  category: NormalizedCategoryName;
}

export interface UpdateRestaurantRecord {
  restaurantId: string;
  ownerId: string;
  name?: string;
  address?: string;
  coverImageUrl?: string;
  category?: NormalizedCategoryName;
}

class ResourceUnavailableInTransaction extends Error {}

@Injectable()
export class RestaurantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateRestaurantRecord): Promise<RestaurantRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const category = await upsertCategory(transaction, input.category);

      return transaction.restaurant.create({
        data: {
          ownerId: input.ownerId,
          categoryId: category.id,
          name: input.name,
          address: input.address,
          coverImageUrl: input.coverImageUrl,
        },
        select: RESTAURANT_SELECT,
      });
    });
  }

  async update(input: UpdateRestaurantRecord): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        const data: Prisma.RestaurantUncheckedUpdateManyInput = {};

        if (input.name !== undefined) {
          data.name = input.name;
        }
        if (input.address !== undefined) {
          data.address = input.address;
        }
        if (input.coverImageUrl !== undefined) {
          data.coverImageUrl = input.coverImageUrl;
        }
        if (input.category !== undefined) {
          const category = await upsertCategory(transaction, input.category);
          data.categoryId = category.id;
        }

        const updated = await transaction.restaurant.updateMany({
          where: {
            id: input.restaurantId,
            ownerId: input.ownerId,
          },
          data,
        });

        if (updated.count !== 1) {
          throw new ResourceUnavailableInTransaction();
        }
      });
      return true;
    } catch (error) {
      if (error instanceof ResourceUnavailableInTransaction) {
        return false;
      }
      throw error;
    }
  }

  async delete(restaurantId: string, ownerId: string): Promise<boolean> {
    const deleted = await this.prisma.restaurant.deleteMany({
      where: {
        id: restaurantId,
        ownerId,
      },
    });
    return deleted.count === 1;
  }
}

async function upsertCategory(
  transaction: Prisma.TransactionClient,
  category: NormalizedCategoryName,
): Promise<{ id: string }> {
  return transaction.category.upsert({
    where: {
      normalizedName: category.normalizedName,
    },
    update: {},
    create: {
      name: category.name,
      normalizedName: category.normalizedName,
      slug: category.slug,
    },
    select: {
      id: true,
    },
  });
}
