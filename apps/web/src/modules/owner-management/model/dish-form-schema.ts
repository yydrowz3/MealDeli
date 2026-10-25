import { message as localizedMessage } from "../../../shared/i18n";
import { z } from "zod";

import type { Dish, DishOption } from "../../catalog";
import type { DishFormValues, DishWriteDraft } from "./types";
import { formatMinorForInput, parseUsdToMinor } from "./money";

const optionalIdSchema = z.uuid().optional();
const uiKeySchema = z.string().min(1);
const requiredTrimmed = (message: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, message));
const moneyStringSchema = z.string().superRefine((value, context) => {
  const result = parseUsdToMinor(value);
  if (!result.ok) context.addIssue({ code: "custom", message: result.message });
});

const choiceSchema = z.object({
  id: optionalIdSchema,
  uiKey: uiKeySchema,
  name: requiredTrimmed(localizedMessage("owner.choiceRequired")),
  extraPrice: moneyStringSchema,
});

const optionSchema = z
  .object({
    id: optionalIdSchema,
    uiKey: uiKeySchema,
    name: requiredTrimmed(localizedMessage("owner.optionRequired")),
    minSelections: z.number().int().min(0, localizedMessage("owner.minNonNegative")),
    maxSelections: z.number().int().min(1, localizedMessage("owner.maxPositive")),
    choices: z.array(choiceSchema).min(1, localizedMessage("owner.choiceRequiredList")),
  })
  .superRefine((option, context) => {
    if (option.minSelections > option.maxSelections) {
      context.addIssue({
        code: "custom",
        path: ["minSelections"],
        message: localizedMessage("owner.minExceedsMax"),
      });
    }
    if (option.maxSelections > option.choices.length) {
      context.addIssue({
        code: "custom",
        path: ["maxSelections"],
        message: localizedMessage("owner.maxExceedsChoices"),
      });
    }
  });

export const dishFormSchema = z.object({
  name: requiredTrimmed(localizedMessage("owner.dishRequired")),
  description: requiredTrimmed(localizedMessage("owner.descriptionRequired")),
  price: moneyStringSchema,
  image: z.union([z.url(localizedMessage("common.imageUrl")), z.null()]),
  options: z.array(optionSchema),
});

export type UiKeyFactory = () => string;

export function createUiKeyFactory(): UiKeyFactory {
  return () => globalThis.crypto.randomUUID();
}

export function createEmptyDishChoice(
  createKey: UiKeyFactory,
): DishFormValues["options"][number]["choices"][number] {
  return { uiKey: createKey(), name: "", extraPrice: "0.00" };
}

export function createEmptyDishOption(createKey: UiKeyFactory): DishFormValues["options"][number] {
  return {
    uiKey: createKey(),
    name: "",
    minSelections: 0,
    maxSelections: 1,
    choices: [createEmptyDishChoice(createKey)],
  };
}

function optionToForm(option: DishOption, createKey: UiKeyFactory) {
  return {
    id: option.id,
    uiKey: createKey(),
    name: option.name,
    minSelections: option.minSelections,
    maxSelections: option.maxSelections,
    choices: option.choices.map((choice) => ({
      id: choice.id,
      uiKey: createKey(),
      name: choice.name,
      extraPrice: formatMinorForInput(choice.extraMinor),
    })),
  };
}

export function dishToFormValues(
  dish?: Dish,
  createKey: UiKeyFactory = createUiKeyFactory(),
): DishFormValues {
  return dish
    ? {
        name: dish.name,
        description: dish.description,
        price: formatMinorForInput(dish.priceMinor),
        image: dish.image,
        options: dish.options.map((option) => optionToForm(option, createKey)),
      }
    : { name: "", description: "", price: "", image: null, options: [] };
}

export function toDishWriteDraft(values: DishFormValues): DishWriteDraft {
  const parsed = dishFormSchema.parse(values);
  const price = parseUsdToMinor(parsed.price);
  if (!price.ok) throw new Error(price.message);
  return {
    name: parsed.name,
    description: parsed.description,
    priceMinor: price.minor,
    image: parsed.image,
    options: parsed.options.map((option) => ({
      ...(option.id ? { id: option.id } : {}),
      name: option.name,
      minSelections: option.minSelections,
      maxSelections: option.maxSelections,
      choices: option.choices.map((choice) => {
        const extra = parseUsdToMinor(choice.extraPrice);
        if (!extra.ok) throw new Error(extra.message);
        return {
          ...(choice.id ? { id: choice.id } : {}),
          name: choice.name,
          extraMinor: extra.minor,
        };
      }),
    })),
  };
}
