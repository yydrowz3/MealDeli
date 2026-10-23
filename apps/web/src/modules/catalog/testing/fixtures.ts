import type {
  CatalogPage,
  CategorySummary,
  Dish,
  DishOption,
  DishOptionChoice,
  RestaurantDetail,
  RestaurantSummary,
} from "../model/types";

export function buildCategory(overrides: Partial<CategorySummary> = {}): CategorySummary {
  return {
    id: "category-korean",
    name: "Korean",
    slug: "korean",
    image: null,
    restaurantCount: 2,
    ...overrides,
  };
}

export function buildDishChoice(overrides: Partial<DishOptionChoice> = {}): DishOptionChoice {
  return {
    id: "choice-spicy",
    name: "Spicy",
    extraMinor: 150,
    ...overrides,
  };
}

export function buildDishOption(overrides: Partial<DishOption> = {}): DishOption {
  return {
    id: "option-heat",
    name: "Heat level",
    minSelections: 1,
    maxSelections: 1,
    choices: [buildDishChoice()],
    ...overrides,
  };
}

export function buildDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: "dish-bibimbap",
    restaurantId: "restaurant-seoul-kitchen",
    name: "Bibimbap",
    description: "Rice, vegetables, egg, and gochujang.",
    priceMinor: 1299,
    image: null,
    options: [buildDishOption()],
    ...overrides,
  };
}

export function buildRestaurant(overrides: Partial<RestaurantSummary> = {}): RestaurantSummary {
  return {
    id: "restaurant-seoul-kitchen",
    name: "Seoul Kitchen",
    address: "100 Market Street, San Francisco",
    image: null,
    category: { id: "category-korean", name: "Korean", slug: "korean" },
    promotedUntil: null,
    ...overrides,
  };
}

export function buildRestaurantDetail(overrides: Partial<RestaurantDetail> = {}): RestaurantDetail {
  return {
    ...buildRestaurant(overrides),
    dishes: overrides.dishes ?? [buildDish()],
  };
}

export function buildRestaurantPage(
  overrides: Partial<CatalogPage<RestaurantSummary>> = {},
): CatalogPage<RestaurantSummary> {
  return {
    items: [buildRestaurant()],
    page: 1,
    totalPages: 1,
    totalResults: 1,
    ...overrides,
  };
}

export function restaurantToGraphql(restaurant: RestaurantSummary) {
  return {
    __typename: "Restaurant" as const,
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    image: restaurant.image,
    promotedUntil: restaurant.promotedUntil,
    categoryId: restaurant.category.id,
    category: { __typename: "Category" as const, ...restaurant.category },
  };
}

export function dishToGraphql(dish: Dish) {
  return {
    __typename: "Dish" as const,
    ...dish,
    options: dish.options.map((option) => ({
      __typename: "DishOption" as const,
      ...option,
      choices: option.choices.map((choice) => ({
        __typename: "DishChoice" as const,
        ...choice,
      })),
    })),
  };
}
