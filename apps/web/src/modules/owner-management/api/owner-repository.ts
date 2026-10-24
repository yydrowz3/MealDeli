import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { useFragment as readFragment } from "../../../gql";
import type { FragmentType } from "../../../gql";
import {
  OwnerManagementCreateDishDocument,
  OwnerManagementCreateRestaurantDocument,
  OwnerManagementDeleteDishDocument,
  OwnerManagementDeleteRestaurantDocument,
  OwnerManagementDishFragmentDoc,
  OwnerManagementDishOptionFragmentDoc,
  OwnerManagementEditDishDocument,
  OwnerManagementEditRestaurantDocument,
  OwnerManagementMyRestaurantDocument,
  OwnerManagementMyRestaurantsDocument,
  OwnerManagementRestaurantFragmentDoc,
} from "../../../gql/graphql";
import type { Dish, RestaurantDetail } from "../../catalog";
import type {
  DishWriteDraft,
  OwnerCommandResult,
  OwnerRestaurant,
  OwnerRestaurantRepository,
  RestaurantDraft,
  RestaurantSettingsDraft,
} from "../model/types";

export interface OwnerManagementGraphqlTransport {
  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult>;
}

export class OwnerManagementRepositoryError extends Error {
  constructor(message = "The restaurant request failed.", options?: ErrorOptions) {
    super(message, options);
    this.name = "OwnerManagementRepositoryError";
  }
}

function safeMessage(message: string | null | undefined, fallback: string): string {
  if (!message) return fallback;
  if (/permission|don't own|can't edit|can't delete/i.test(message)) return "Restaurant not found.";
  return message;
}

function adaptDish(reference: FragmentType<typeof OwnerManagementDishFragmentDoc>): Dish {
  const dish = readFragment(OwnerManagementDishFragmentDoc, reference);
  return {
    id: dish.id,
    restaurantId: dish.restaurantId,
    name: dish.name,
    description: dish.description,
    priceMinor: dish.priceMinor,
    image: dish.image ?? null,
    options: dish.options.map((optionReference) => {
      const option = readFragment(OwnerManagementDishOptionFragmentDoc, optionReference);
      return {
        id: option.id,
        name: option.name,
        minSelections: option.minSelections,
        maxSelections: option.maxSelections,
        choices: option.choices.map((choice) => ({
          id: choice.id,
          name: choice.name,
          extraMinor: choice.extraMinor,
        })),
      };
    }),
  };
}

export function adaptOwnerRestaurant(
  reference: FragmentType<typeof OwnerManagementRestaurantFragmentDoc>,
): OwnerRestaurant {
  const restaurant = readFragment(OwnerManagementRestaurantFragmentDoc, reference);
  const detail: RestaurantDetail = {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    image: restaurant.image ?? null,
    promotedUntil: typeof restaurant.promotedUntil === "string" ? restaurant.promotedUntil : null,
    category: restaurant.category ?? {
      id: restaurant.categoryId,
      name: "Uncategorized",
      slug: "",
    },
    dishes: (restaurant.dishes ?? []).map(adaptDish),
  };
  return {
    ...detail,
    createdAt: String(restaurant.createdAt),
    updatedAt: String(restaurant.updatedAt),
  };
}

function toCreateDishInput(restaurantId: string, draft: DishWriteDraft) {
  return {
    restaurantId,
    name: draft.name,
    description: draft.description,
    priceMinor: draft.priceMinor,
    image: draft.image,
    options: draft.options.map((option) => ({
      name: option.name,
      minSelections: option.minSelections,
      maxSelections: option.maxSelections,
      choices: option.choices.map((choice) => ({
        name: choice.name,
        extraMinor: choice.extraMinor,
      })),
    })),
  };
}

function toEditDishInput(dishId: string, draft: DishWriteDraft) {
  return {
    dishId,
    name: draft.name,
    description: draft.description,
    priceMinor: draft.priceMinor,
    image: draft.image,
    options: draft.options.map((option) => ({
      ...(option.id ? { id: option.id } : {}),
      name: option.name,
      minSelections: option.minSelections,
      maxSelections: option.maxSelections,
      choices: option.choices.map((choice) => ({
        ...(choice.id ? { id: choice.id } : {}),
        name: choice.name,
        extraMinor: choice.extraMinor,
      })),
    })),
  };
}

function failed<T>(message: string): OwnerCommandResult<T> {
  return { ok: false, message };
}

export function createOwnerRestaurantRepository(
  transport: OwnerManagementGraphqlTransport,
): OwnerRestaurantRepository {
  const get = async (restaurantId: string): Promise<OwnerRestaurant | null> => {
    const data = await transport.execute(OwnerManagementMyRestaurantDocument, {
      input: { id: restaurantId },
    });
    const output = data.myRestaurant;
    if (!output.ok || !output.restaurant) {
      if (/not found/i.test(output.error ?? "")) return null;
      throw new OwnerManagementRepositoryError(
        safeMessage(output.error, "We couldn’t load this restaurant."),
      );
    }
    return adaptOwnerRestaurant(output.restaurant);
  };

  const refresh = async (restaurantId: string): Promise<OwnerCommandResult<OwnerRestaurant>> => {
    const restaurant = await get(restaurantId);
    return restaurant ? { ok: true, value: restaurant } : failed("Restaurant not found.");
  };

  const execute = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof OwnerManagementRepositoryError) throw error;
      throw new OwnerManagementRepositoryError(undefined, { cause: error });
    }
  };

  return {
    async list() {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementMyRestaurantsDocument, {});
        if (!data.myRestaurants.ok) {
          throw new OwnerManagementRepositoryError(
            safeMessage(data.myRestaurants.error, "We couldn’t load your restaurants."),
          );
        }
        return (data.myRestaurants.restaurants ?? []).map((restaurant) =>
          adaptOwnerRestaurant(restaurant),
        );
      });
    },

    async get(restaurantId) {
      return execute(() => get(restaurantId));
    },

    async create(draft: RestaurantDraft) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementCreateRestaurantDocument, {
          input: draft,
        });
        const output = data.createRestaurant;
        if (!output.ok || !output.restaurantId) {
          return failed(safeMessage(output.error, "We couldn’t create the restaurant."));
        }
        return refresh(output.restaurantId);
      });
    },

    async update(restaurantId: string, draft: RestaurantSettingsDraft) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementEditRestaurantDocument, {
          input: { restaurantId, ...draft },
        });
        if (!data.editRestaurant.ok) {
          return failed(safeMessage(data.editRestaurant.error, "We couldn’t save your changes."));
        }
        return refresh(restaurantId);
      });
    },

    async delete(restaurantId: string) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementDeleteRestaurantDocument, {
          input: { restaurantId },
        });
        return data.deleteRestaurant.ok
          ? { ok: true as const, value: undefined }
          : failed(safeMessage(data.deleteRestaurant.error, "We couldn’t delete this restaurant."));
      });
    },

    async createDish(restaurantId, draft) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementCreateDishDocument, {
          input: toCreateDishInput(restaurantId, draft),
        });
        if (!data.createDish.ok) {
          return failed(safeMessage(data.createDish.error, "We couldn’t add this dish."));
        }
        return refresh(restaurantId);
      });
    },

    async updateDish(dishId, restaurantId, draft) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementEditDishDocument, {
          input: toEditDishInput(dishId, draft),
        });
        if (!data.editDish.ok) {
          return failed(safeMessage(data.editDish.error, "We couldn’t save this dish."));
        }
        return refresh(restaurantId);
      });
    },

    async deleteDish(dishId, restaurantId) {
      return execute(async () => {
        const data = await transport.execute(OwnerManagementDeleteDishDocument, {
          input: { dishId },
        });
        if (!data.deleteDish.ok) {
          return failed(safeMessage(data.deleteDish.error, "We couldn’t delete this dish."));
        }
        return refresh(restaurantId);
      });
    },
  };
}
