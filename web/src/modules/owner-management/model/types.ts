import type { Dish, RestaurantDetail } from "../../catalog";

export type OwnerRestaurant = RestaurantDetail &
  Readonly<{
    createdAt: string;
    updatedAt: string;
  }>;

export type RestaurantDraft = Readonly<{
  name: string;
  categoryId: string;
  address: string;
  image: string | null;
}>;

export type RestaurantSettingsDraft = Readonly<{
  name: string;
  address: string;
  image: string | null;
}>;

export type DishChoiceDraft = {
  id?: string;
  uiKey: string;
  name: string;
  extraPrice: string;
};

export type DishOptionDraft = {
  id?: string;
  uiKey: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: DishChoiceDraft[];
};

export type DishFormValues = {
  name: string;
  description: string;
  price: string;
  image: string | null;
  options: DishOptionDraft[];
};

export type DishWriteDraft = Readonly<{
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  options: readonly Readonly<{
    id?: string;
    name: string;
    minSelections: number;
    maxSelections: number;
    choices: readonly Readonly<{
      id?: string;
      name: string;
      extraMinor: number;
    }>[];
  }>[];
}>;

export type OwnerCommandResult<T = undefined> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; message: string }>;

export interface OwnerRestaurantRepository {
  list(): Promise<readonly OwnerRestaurant[]>;
  get(restaurantId: string): Promise<OwnerRestaurant | null>;
  create(draft: RestaurantDraft): Promise<OwnerCommandResult<OwnerRestaurant>>;
  update(
    restaurantId: string,
    draft: RestaurantSettingsDraft,
  ): Promise<OwnerCommandResult<OwnerRestaurant>>;
  delete(restaurantId: string): Promise<OwnerCommandResult>;
  createDish(
    restaurantId: string,
    draft: DishWriteDraft,
  ): Promise<OwnerCommandResult<OwnerRestaurant>>;
  updateDish(
    dishId: string,
    restaurantId: string,
    draft: DishWriteDraft,
  ): Promise<OwnerCommandResult<OwnerRestaurant>>;
  deleteDish(dishId: string, restaurantId: string): Promise<OwnerCommandResult<OwnerRestaurant>>;
}

export type OwnerRestaurantSelection = Readonly<{
  selectedRestaurantId: string | null;
}>;

export type OwnerMenuDish = Dish;
