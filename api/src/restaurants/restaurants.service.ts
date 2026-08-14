import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dto/create-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dto/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dto/delete-restaurant.dto';
import { AllCategoriesOutput } from './dto/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dto/category.dto';
import { ConfigService } from '@nestjs/config';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dto/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dto/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';
import { MyRestaurantsOutput } from './dto/my-restaurants.dto';
import { MyRestaurantInput, MyRestaurantOutput } from './dto/my-restaurant.dto';
import {
  CreateCategoryInput,
  CreateCategoryOutput,
} from './dto/create-category.dto';
import {
  UpdateCategoryInput,
  UpdateCategoryOutput,
} from './dto/update-category.dto';
import {
  DeleteCategoryInput,
  DeleteCategoryOutput,
} from './dto/delete-category.dto';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.prismaService.restaurant.create({
        data: {
          ...createRestaurantInput,
          ownerId: owner.id,
        },
      });
      return {
        ok: true,
        restaurantId: newRestaurant.id,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create restaurant',
        restaurantId: null,
      };
    }
  }

  async createCategory(
    createCategoryInput: CreateCategoryInput,
  ): Promise<CreateCategoryOutput> {
    try {
      const categoryName = createCategoryInput.name.trim().toLocaleLowerCase();
      const categorySlug = categoryName.replace(/ /g, '-');
      const category = await this.prismaService.category.findUnique({
        where: {
          slug: categorySlug,
        },
      });
      if (category) {
        return {
          ok: false,
          error: 'Category already exists',
        };
      }
      await this.prismaService.category.create({
        data: {
          name: createCategoryInput.name.trim(),
          slug: categorySlug,
          ...(createCategoryInput.image && {
            image: createCategoryInput.image,
          }),
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create category',
      };
    }
  }

  async updateCategory(
    updateCategoryInput: UpdateCategoryInput,
  ): Promise<UpdateCategoryOutput> {
    try {
      const category = await this.prismaService.category.findUnique({
        where: {
          id: updateCategoryInput.id,
        },
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      if (
        updateCategoryInput.name &&
        category.name != updateCategoryInput.name
      ) {
        const categoryName = updateCategoryInput.name
          .trim()
          .toLocaleLowerCase();
        const categorySlug = categoryName.replace(/ /g, '-');
        const existingCategory = await this.prismaService.category.findUnique({
          where: {
            slug: categorySlug,
          },
        });
        if (existingCategory) {
          return {
            ok: false,
            error: 'Category already exists',
          };
        }
        await this.prismaService.category.update({
          data: {
            name: updateCategoryInput.name.trim(),
            slug: categorySlug,
            ...(updateCategoryInput.image && {
              image: updateCategoryInput.image,
            }),
          },
          where: {
            id: category.id,
          },
        });
      } else {
        await this.prismaService.category.update({
          data: {
            ...(updateCategoryInput.image && {
              image: updateCategoryInput.image,
            }),
          },
          where: {
            id: category.id,
          },
        });
      }
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not update category',
      };
    }
  }
  async deleteCategory(
    deleteCategoryInput: DeleteCategoryInput,
  ): Promise<DeleteCategoryOutput> {
    try {
      const category = await this.prismaService.category.findUnique({
        where: {
          id: deleteCategoryInput.id,
        },
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      await this.prismaService.category.delete({
        where: {
          id: deleteCategoryInput.id,
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete category',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: { id: editRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };
      }
      // TODO: check category name valid
      await this.prismaService.restaurant.update({
        data: {
          ...editRestaurantInput,
        },
        where: {
          id: editRestaurantInput.restaurantId,
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: { id: deleteRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't delete a restaurant that you don't own",
        };
      }
      await this.prismaService.restaurant.delete({
        where: {
          id: deleteRestaurantInput.restaurantId,
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete restaurant.',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.prismaService.category.findMany();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load categories',
        categories: null,
      };
    }
  }

  async countRestaurants(categoryId: string) {
    return await this.prismaService.restaurant.count({
      where: {
        categoryId,
      },
    });
  }

  async findCategoryBySlug(
    categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    try {
      const category = await this.prismaService.category.findUnique({
        where: {
          slug: categoryInput.slug,
        },
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
          category: null,
          restaurants: null,
        };
      }
      const pageSize = this.configService.get<number>('CATEGORY_PAGE_SIZE', 15);
      const restaurants = await this.prismaService.restaurant.findMany({
        where: {
          categoryId: category.id,
        },
        // Future promotion dates sort ahead of expired dates and null values.
        orderBy: [
          { promotedUntil: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: pageSize,
        skip: (categoryInput.page - 1) * pageSize,
      });
      const totalResults = await this.countRestaurants(category.id);
      return {
        ok: true,
        restaurants,
        category,
        totalResults,
        totalPages: Math.ceil(totalResults / pageSize),
      };
    } catch {
      return {
        ok: false,
        restaurants: null,
        category: null,
        error: 'Could not load category',
      };
    }
  }

  async allRestaurants(
    restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    try {
      const pageSize = this.configService.get<number>(
        'RESTAURANTS_PAGE_SIZE',
        15,
      );
      // const totalResults = await this.prismaService.restaurant.count();
      const [restaurants, totalResults] = await Promise.all([
        this.prismaService.restaurant.findMany({
          skip: (restaurantsInput.page - 1) * pageSize,
          take: pageSize,
          orderBy: [
            { promotedUntil: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        }),
        this.prismaService.restaurant.count(),
      ]);
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / pageSize),
      };
    } catch {
      return {
        ok: false,
        error: 'could not load restaurants',
      };
    }
  }

  async findRestaurantById(
    restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: {
          id: restaurantInput.restaurantId,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
          restaurant: null,
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find restaurant.',
        restaurant: null,
      };
    }
  }

  async searchRestaurantByName(
    searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try {
      const pageSize = this.configService.get<number>(
        'RESTAURANTS_PAGE_SIZE',
        15,
      );
      const query = searchRestaurantInput.query.trim();
      const where = {
        name: {
          contains: query,
          mode: 'insensitive' as const,
        },
      };
      const [restaurants, totalResults] = await Promise.all([
        this.prismaService.restaurant.findMany({
          where,
          skip: (searchRestaurantInput.page - 1) * pageSize,
          take: pageSize,
          orderBy: [
            { promotedUntil: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        }),
        this.prismaService.restaurant.count({ where }),
      ]);
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / pageSize),
      };
    } catch {
      return {
        ok: false,
        error: 'Could not search for restaurants.',
        restaurants: null,
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: {
          id: createDishInput.restaurantId,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Permission denied for this restaurant.',
        };
      }
      const { restaurantId, options, ...dishData } = createDishInput;
      const dishOptions = options.map((option) => ({
        id: randomUUID(),
        name: option.name,
        minSelections: option.minSelections,
        maxSelections: option.maxSelections,
        choices: option.choices.map((choice) => ({
          id: randomUUID(),
          name: choice.name,
          extraMinor: choice.extraMinor,
        })),
      }));
      if (
        dishOptions.some(
          (option) =>
            option.minSelections > option.maxSelections ||
            option.maxSelections > option.choices.length,
        )
      ) {
        return {
          ok: false,
          error: 'Dish option selection limits are invalid.',
        };
      }
      await this.prismaService.dish.create({
        data: {
          ...dishData,
          restaurantId,
          options: dishOptions as Prisma.InputJsonValue,
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create dish.',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.prismaService.dish.findUnique({
        where: {
          id: editDishInput.dishId,
        },
        select: {
          restaurant: {
            select: {
              ownerId: true,
            },
          },
        },
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found.',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Permission denied for this dish.',
        };
      }
      const { dishId, options, ...dishData } = editDishInput;
      const dishOptions = options?.map((option) => ({
        id: option.id ?? randomUUID(),
        name: option.name,
        minSelections: option.minSelections,
        maxSelections: option.maxSelections,
        choices: option.choices.map((choice) => ({
          id: choice.id ?? randomUUID(),
          name: choice.name,
          extraMinor: choice.extraMinor,
        })),
      }));
      if (
        dishOptions?.some(
          (option) =>
            option.minSelections > option.maxSelections ||
            option.maxSelections > option.choices.length,
        )
      ) {
        return {
          ok: false,
          error: 'Dish option selection limits are invalid.',
        };
      }
      if (
        dishOptions &&
        (new Set(dishOptions.map((option) => option.id)).size !==
          dishOptions.length ||
          dishOptions.some(
            (option) =>
              new Set(option.choices.map((choice) => choice.id)).size !==
              option.choices.length,
          ))
      ) {
        return {
          ok: false,
          error: 'Dish option IDs must be unique.',
        };
      }
      await this.prismaService.dish.update({
        where: {
          id: dishId,
        },
        data: {
          ...dishData,
          ...(dishOptions && {
            options: dishOptions as Prisma.InputJsonValue,
          }),
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit dish.',
      };
    }
  }

  async deleteDish(
    owner: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.prismaService.dish.findUnique({
        where: {
          id: deleteDishInput.dishId,
        },
        select: {
          restaurant: {
            select: {
              ownerId: true,
            },
          },
        },
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found.',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Permission denied for this dish.',
        };
      }
      await this.prismaService.dish.delete({
        where: {
          id: deleteDishInput.dishId,
        },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete dish.',
      };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.prismaService.restaurant.findMany({
        where: {
          ownerId: owner.id,
        },
      });
      return {
        ok: true,
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load restaurants.',
        restaurants: null,
      };
    }
  }

  async myRestaurant(
    owner: User,
    myRestaurantInput: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: {
          id: myRestaurantInput.id,
          ownerId: owner.id,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
          restaurant: null,
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load restaurant.',
        restaurant: null,
      };
    }
  }
}
