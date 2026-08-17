import { z } from "zod";

import type { Dish } from "../../catalog";
import { getCartLineTotalMinor } from "./cart-selectors";
import type { CartLine } from "./types";

export type DishOptionSelection = Readonly<{
  optionId: string;
  choiceIds: readonly string[];
}>;

export type DishSelectionValues = Readonly<{
  quantity: number;
  selections: readonly DishOptionSelection[];
}>;

const selectionShape = z.object({
  optionId: z.string().min(1),
  choiceIds: z.array(z.string().min(1)),
});

export function createDishSelectionSchema(dish: Dish) {
  return z
    .object({
      quantity: z.number().int().min(1).max(99),
      selections: z.array(selectionShape),
    })
    .superRefine((value, context) => {
      const seenOptions = new Set<string>();
      for (const [selectionIndex, selection] of value.selections.entries()) {
        if (seenOptions.has(selection.optionId)) {
          context.addIssue({
            code: "custom",
            message: "Each option may only be selected once.",
            path: ["selections", selectionIndex, "optionId"],
          });
          continue;
        }
        seenOptions.add(selection.optionId);
        const option = dish.options.find((candidate) => candidate.id === selection.optionId);
        if (!option) {
          context.addIssue({
            code: "custom",
            message: "This option is no longer available.",
            path: ["selections", selectionIndex, "optionId"],
          });
          continue;
        }
        if (new Set(selection.choiceIds).size !== selection.choiceIds.length) {
          context.addIssue({
            code: "custom",
            message: "A choice cannot be selected more than once.",
            path: ["selections", selectionIndex, "choiceIds"],
          });
        }
        const knownChoices = new Set(option.choices.map((choice) => choice.id));
        if (selection.choiceIds.some((choiceId) => !knownChoices.has(choiceId))) {
          context.addIssue({
            code: "custom",
            message: "A selected choice is no longer available.",
            path: ["selections", selectionIndex, "choiceIds"],
          });
        }
        if (
          selection.choiceIds.length < option.minSelections ||
          selection.choiceIds.length > option.maxSelections
        ) {
          context.addIssue({
            code: "custom",
            message: optionSelectionRule(option.minSelections, option.maxSelections),
            path: ["selections", selectionIndex, "choiceIds"],
          });
        }
      }
      for (const option of dish.options) {
        if (option.minSelections > 0 && !seenOptions.has(option.id)) {
          context.addIssue({
            code: "custom",
            message: optionSelectionRule(option.minSelections, option.maxSelections),
            path: ["selections"],
          });
        }
      }
    });
}

export function createDishSelectionDefaults(dish: Dish): DishSelectionValues {
  return {
    quantity: 1,
    selections: dish.options.map((option) => ({ optionId: option.id, choiceIds: [] })),
  };
}

export function optionSelectionRule(minSelections: number, maxSelections: number): string {
  if (minSelections === 1 && maxSelections === 1) return "Choose 1 option.";
  if (minSelections === 0 && maxSelections === 1) return "Optional";
  if (minSelections === 0) return `Choose up to ${maxSelections}.`;
  if (minSelections === maxSelections) return `Choose ${minSelections}.`;
  return `Choose ${minSelections}–${maxSelections}.`;
}

export function getDishSelectionUnitMinor(
  dish: Dish,
  values: DishSelectionValues,
): number {
  const extraMinor = values.selections.reduce((total, selection) => {
    const option = dish.options.find((candidate) => candidate.id === selection.optionId);
    if (!option) return total;
    return (
      total +
      selection.choiceIds.reduce(
        (choiceTotal, choiceId) =>
          choiceTotal + (option.choices.find((choice) => choice.id === choiceId)?.extraMinor ?? 0),
        0,
      )
    );
  }, 0);
  return dish.priceMinor + extraMinor;
}

export function getDishSelectionTotalMinor(dish: Dish, values: DishSelectionValues): number {
  return getDishSelectionUnitMinor(dish, values) * values.quantity;
}

export function createCartLineFromSelection(
  dish: Dish,
  values: DishSelectionValues,
  uuid: () => string = () => crypto.randomUUID(),
): CartLine {
  const parsed = createDishSelectionSchema(dish).parse(values);
  const selectedOptions = parsed.selections
    .map((selection) => {
      const option = dish.options.find((candidate) => candidate.id === selection.optionId);
      if (!option || selection.choiceIds.length === 0) return null;
      return {
        optionId: option.id,
        name: option.name,
        choices: selection.choiceIds.map((choiceId) => {
          const choice = option.choices.find((candidate) => candidate.id === choiceId);
          if (!choice) throw new Error("Dish selection was not valid.");
          return { choiceId: choice.id, name: choice.name, extraMinor: choice.extraMinor };
        }),
      };
    })
    .filter((option) => option !== null);
  const selectionKey = selectedOptions
    .map((option) => `${option.optionId}:${option.choices.map((choice) => choice.choiceId).sort().join(",")}`)
    .sort()
    .join("|");
  const line: CartLine = {
    lineId: `${dish.id}:${selectionKey}:${uuid()}`,
    dishId: dish.id,
    dishName: dish.name,
    basePriceMinor: dish.priceMinor,
    image: dish.image,
    options: selectedOptions,
    quantity: parsed.quantity,
  };
  getCartLineTotalMinor(line);
  return line;
}
