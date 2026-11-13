import { MenuOptionDefinition } from '../domain/menu-option-definition';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { DISH_SELECT, DishRecord } from './catalog.selects';
import { toPrismaMenuOptions } from './menu-options-json';

export interface CreateDishRecord {
  ownerId: string;
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  photoUrl: string | null;
  options: MenuOptionDefinition[];
}

export interface UpdateDishRecord {
  ownerId: string;
  dishId: string;
  name?: string;
  description?: string;
  priceMinor?: number;
  photoUrl?: string | null;
  options?: MenuOptionDefinition[];
}

class ResourceUnavailableInTransaction extends Error {}

@Injectable()
export class DishRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDishRecord): Promise<DishRecord | null> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const restaurant = await transaction.restaurant.findFirst({
          where: {
            id: input.restaurantId,
            ownerId: input.ownerId,
          },
          select: { id: true },
        });

        if (!restaurant) {
          throw new ResourceUnavailableInTransaction();
        }

        return transaction.dish.create({
          data: {
            restaurantId: restaurant.id,
            name: input.name,
            description: input.description,
            priceMinor: input.priceMinor,
            photoUrl: input.photoUrl,
            options: toPrismaMenuOptions(input.options),
          },
          select: DISH_SELECT,
        });
      });
    } catch (error) {
      if (error instanceof ResourceUnavailableInTransaction) {
        return null;
      }
      throw error;
    }
  }

  async update(input: UpdateDishRecord): Promise<boolean> {
    const data: Prisma.DishUpdateManyMutationInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.priceMinor !== undefined) {
      data.priceMinor = input.priceMinor;
    }
    if (input.photoUrl !== undefined) {
      data.photoUrl = input.photoUrl;
    }
    if (input.options !== undefined) {
      data.options = toPrismaMenuOptions(input.options);
    }

    const updated = await this.prisma.dish.updateMany({
      where: {
        id: input.dishId,
        restaurant: {
          is: {
            ownerId: input.ownerId,
          },
        },
      },
      data,
    });
    return updated.count === 1;
  }

  async delete(dishId: string, ownerId: string): Promise<boolean> {
    const deleted = await this.prisma.dish.deleteMany({
      where: {
        id: dishId,
        restaurant: {
          is: {
            ownerId,
          },
        },
      },
    });
    return deleted.count === 1;
  }
}
