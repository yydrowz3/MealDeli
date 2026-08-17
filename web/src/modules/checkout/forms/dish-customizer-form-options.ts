import { formOptions } from "@tanstack/react-form";

import type { Dish } from "../../catalog";
import {
  createDishSelectionDefaults,
  createDishSelectionSchema,
  type DishSelectionValues,
} from "../model/dish-selection";

export function createDishCustomizerFormOptions(
  dish: Dish,
  defaultValues: DishSelectionValues = createDishSelectionDefaults(dish),
) {
  const schema = createDishSelectionSchema(dish);
  return formOptions({
    defaultValues,
    validators: { onSubmit: schema },
  });
}
