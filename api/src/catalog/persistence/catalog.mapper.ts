import { CatalogInputError } from '../domain/catalog-input.error';
import {
  MenuOptionDefinition,
  parseMenuOptionDefinitions,
} from '../domain/menu-option-definition';
import { CategoryModel } from '../models/category.model';
import { DishOptionModel } from '../models/dish-option.model';
import { DishModel } from '../models/dish.model';
import { RestaurantModel } from '../models/restaurant.model';
import {
  CategoryRecord,
  DishRecord,
  RestaurantRecord,
} from './catalog.selects';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class CatalogMapper {
  private readonly logger = new Logger(CatalogMapper.name);

  toCategory(category: CategoryRecord): CategoryModel {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      coverImageUrl: category.coverImageUrl,
      restaurantCount: category._count.restaurants,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  toRestaurant(
    restaurant: RestaurantRecord,
    evaluatedAt: Date,
  ): RestaurantModel {
    return {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      coverImageUrl: restaurant.coverImageUrl,
      category: this.toCategory(restaurant.category),
      menu: [],
      isPromoted:
        restaurant.promotedUntil !== null &&
        restaurant.promotedUntil.getTime() > evaluatedAt.getTime(),
      promotedUntil: restaurant.promotedUntil ?? undefined,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }

  toDish(dish: DishRecord): DishModel {
    let definitions: MenuOptionDefinition[];
    try {
      definitions = parseMenuOptionDefinitions(dish.options);
    } catch (error) {
      if (!(error instanceof CatalogInputError)) {
        throw error;
      }

      this.logger.error(`Invalid persisted menu options for dish ${dish.id}.`);
      throw new InternalServerErrorException('Catalog data is unavailable.');
    }

    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      priceMinor: dish.priceMinor,
      photoUrl: dish.photoUrl,
      options: definitions.map(toDishOptionModel),
      createdAt: dish.createdAt,
      updatedAt: dish.updatedAt,
    };
  }
}

function toDishOptionModel(definition: MenuOptionDefinition): DishOptionModel {
  if (definition.choices !== undefined) {
    return {
      name: definition.name,
      extraMinor: null,
      choices: definition.choices.map((choice) => ({ ...choice })),
    };
  }

  return {
    name: definition.name,
    extraMinor: definition.extraMinor,
    choices: null,
  };
}
