import { formOptions } from "@tanstack/react-form";

import type { Dish } from "../../catalog";
import { dishFormSchema, dishToFormValues, type UiKeyFactory } from "../model/dish-form-schema";
import {
  restaurantDraftSchema,
  restaurantSettingsSchema,
  type RestaurantFormValues,
  type RestaurantSettingsFormValues,
} from "../model/restaurant-form-schema";

export function createRestaurantFormOptions(defaultValues?: Partial<RestaurantFormValues>) {
  return formOptions({
    defaultValues: {
      name: "",
      categoryId: "",
      address: "",
      image: null,
      ...defaultValues,
    } satisfies RestaurantFormValues,
    validators: { onBlur: restaurantDraftSchema, onSubmit: restaurantDraftSchema },
  });
}

export function createRestaurantSettingsFormOptions(
  defaultValues?: Partial<RestaurantSettingsFormValues>,
) {
  return formOptions({
    defaultValues: {
      name: "",
      address: "",
      image: null,
      ...defaultValues,
    } satisfies RestaurantSettingsFormValues,
    validators: { onBlur: restaurantSettingsSchema, onSubmit: restaurantSettingsSchema },
  });
}

export function createDishFormOptions(dish?: Dish, createKey?: UiKeyFactory) {
  return formOptions({
    defaultValues: dishToFormValues(dish, createKey),
    validators: { onBlur: dishFormSchema, onSubmit: dishFormSchema },
  });
}
