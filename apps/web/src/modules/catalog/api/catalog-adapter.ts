import { z } from "zod";

import { useFragment as readFragment } from "../../../gql";
import {
  CatalogCategorySummaryFragmentDoc,
  CatalogDishFragmentDoc,
  CatalogDishOptionFragmentDoc,
  CatalogRestaurantCardFragmentDoc,
  CatalogRestaurantDetailFragmentDoc,
  type CatalogAllCategoriesQuery,
  type CatalogCategoryQuery,
  type CatalogRestaurantQuery,
  type CatalogRestaurantsQuery,
  type CatalogSearchRestaurantsQuery,
} from "../../../gql/graphql";
import type {
  CatalogPage,
  CategorySummary,
  Dish,
  RestaurantDetail,
  RestaurantSummary,
} from "../model/types";

const idSchema = z.string().min(1);
const textSchema = z.string();
const integerMinorSchema = z.number().int().safe().nonnegative();
const nullableImageSchema = z
  .string()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const categorySchema = z.object({
  id: idSchema,
  name: textSchema,
  slug: textSchema,
  image: nullableImageSchema,
  restaurantCount: z.number().int().safe().nonnegative().nullable().optional(),
});

const restaurantCategorySchema = z
  .object({
    id: idSchema,
    name: textSchema,
    slug: textSchema,
  })
  .nullable()
  .optional();

const restaurantSummarySchema = z.object({
  id: idSchema,
  name: textSchema,
  address: textSchema,
  image: nullableImageSchema,
  promotedUntil: z.string().datetime({ offset: true }).nullable().optional(),
  categoryId: idSchema,
  category: restaurantCategorySchema,
});

const dishChoiceSchema = z.object({
  id: idSchema,
  name: textSchema,
  extraMinor: integerMinorSchema,
});

const dishOptionSchema = z
  .object({
    id: idSchema,
    name: textSchema,
    minSelections: z.number().int().safe().nonnegative(),
    maxSelections: z.number().int().safe().positive(),
    choices: z.array(dishChoiceSchema),
  })
  .refine((option) => option.minSelections <= option.maxSelections, {
    message: "minSelections cannot exceed maxSelections",
  });

const dishSchema = z.object({
  id: idSchema,
  restaurantId: idSchema,
  name: textSchema,
  description: textSchema,
  priceMinor: integerMinorSchema,
  image: nullableImageSchema,
  options: z.array(dishOptionSchema),
});

const restaurantDetailSchema = restaurantSummarySchema.extend({
  dishes: z.array(dishSchema).nullable().optional(),
});

const outputSchema = z.object({
  ok: z.boolean(),
  error: z.string().nullable().optional(),
});

const paginationSchema = outputSchema.extend({
  totalPages: z.number().int().safe().nonnegative().nullable().optional(),
  totalResults: z.number().int().safe().nonnegative().nullable().optional(),
  restaurants: z.array(restaurantSummarySchema).nullable().optional(),
});

export class CatalogResponseError extends Error {
  readonly code: "malformed" | "server";

  constructor(code: "malformed" | "server", message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CatalogResponseError";
    this.code = code;
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new CatalogResponseError("malformed", `Malformed ${label} response.`, {
      cause: result.error,
    });
  }
  return result.data;
}

function assertOk(output: { ok: boolean; error?: string | null }) {
  if (!output.ok) {
    throw new CatalogResponseError("server", output.error || "The catalog request failed.");
  }
}

export function adaptCategory(value: unknown): CategorySummary {
  const category = parseOrThrow(categorySchema, value, "category");
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image,
    restaurantCount: category.restaurantCount ?? 0,
  };
}

export function adaptRestaurantSummary(value: unknown): RestaurantSummary {
  const restaurant = parseOrThrow(restaurantSummarySchema, value, "restaurant");
  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    image: restaurant.image,
    promotedUntil: restaurant.promotedUntil ?? null,
    category: restaurant.category ?? {
      id: restaurant.categoryId,
      name: "Uncategorized",
      slug: "",
    },
  };
}

export function adaptDish(value: unknown): Dish {
  const dish = parseOrThrow(dishSchema, value, "dish");
  return {
    id: dish.id,
    restaurantId: dish.restaurantId,
    name: dish.name,
    description: dish.description,
    priceMinor: dish.priceMinor,
    image: dish.image,
    options: dish.options.map((option) => ({
      id: option.id,
      name: option.name,
      minSelections: option.minSelections,
      maxSelections: option.maxSelections,
      choices: option.choices.map((choice) => ({ ...choice })),
    })),
  };
}

export function adaptRestaurantDetail(value: unknown): RestaurantDetail {
  const restaurant = parseOrThrow(restaurantDetailSchema, value, "restaurant detail");
  return {
    ...adaptRestaurantSummary(restaurant),
    dishes: (restaurant.dishes ?? []).map(adaptDish),
  };
}

export function adaptCategoriesOutput(value: unknown): readonly CategorySummary[] {
  const output = parseOrThrow(
    outputSchema.extend({ categories: z.array(categorySchema).nullable().optional() }),
    value,
    "categories",
  );
  assertOk(output);
  return (output.categories ?? []).map(adaptCategory);
}

export function adaptRestaurantPageOutput(
  value: unknown,
  page: number,
): CatalogPage<RestaurantSummary> {
  const output = parseOrThrow(paginationSchema, value, "restaurant page");
  assertOk(output);
  return {
    items: (output.restaurants ?? []).map(adaptRestaurantSummary),
    page,
    totalPages: output.totalPages ?? 0,
    totalResults: output.totalResults ?? 0,
  };
}

export function adaptRestaurantOutput(value: unknown): RestaurantDetail | null {
  const output = parseOrThrow(
    outputSchema.extend({ restaurant: restaurantDetailSchema.nullable().optional() }),
    value,
    "restaurant detail",
  );
  if (!output.ok) {
    if (!output.restaurant && /not found/i.test(output.error ?? "")) return null;
    assertOk(output);
  }
  return output.restaurant ? adaptRestaurantDetail(output.restaurant) : null;
}

export function adaptAllCategoriesQuery(
  data: CatalogAllCategoriesQuery,
): readonly CategorySummary[] {
  const output = data.allCategory;
  assertOk(output);
  return (output.categories ?? []).map((category) =>
    adaptCategory(readFragment(CatalogCategorySummaryFragmentDoc, category)),
  );
}

type GeneratedRestaurantPageOutput =
  | CatalogRestaurantsQuery["restaurants"]
  | CatalogCategoryQuery["category"]
  | CatalogSearchRestaurantsQuery["searchRestaurant"];

export function adaptGeneratedRestaurantPage(
  output: GeneratedRestaurantPageOutput,
  page: number,
): CatalogPage<RestaurantSummary> {
  assertOk(output);
  return {
    items: (output.restaurants ?? []).map((restaurant) =>
      adaptRestaurantSummary(readFragment(CatalogRestaurantCardFragmentDoc, restaurant)),
    ),
    page,
    totalPages: output.totalPages ?? 0,
    totalResults: output.totalResults ?? 0,
  };
}

export function adaptGeneratedRestaurantDetail(
  data: CatalogRestaurantQuery,
): RestaurantDetail | null {
  const output = data.restaurant;
  if (!output.ok) {
    if (!output.restaurant && /not found/i.test(output.error ?? "")) return null;
    assertOk(output);
  }
  if (!output.restaurant) return null;

  const detail = readFragment(CatalogRestaurantDetailFragmentDoc, output.restaurant);
  const summary = readFragment(CatalogRestaurantCardFragmentDoc, detail);
  return adaptRestaurantDetail({
    ...summary,
    dishes: (detail.dishes ?? []).map((dishReference) => {
      const dish = readFragment(CatalogDishFragmentDoc, dishReference);
      return {
        ...dish,
        options: dish.options.map((option) => readFragment(CatalogDishOptionFragmentDoc, option)),
      };
    }),
  });
}
