export type CategorySummary = Readonly<{
  id: string;
  name: string;
  slug: string;
  image: string | null;
  restaurantCount: number;
}>;

export type RestaurantCategory = Pick<CategorySummary, "id" | "name" | "slug">;

export type RestaurantSummary = Readonly<{
  id: string;
  name: string;
  address: string;
  image: string | null;
  category: RestaurantCategory;
  promotedUntil: string | null;
}>;

export type DishOptionChoice = Readonly<{
  id: string;
  name: string;
  extraMinor: number;
}>;

export type DishOption = Readonly<{
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: readonly DishOptionChoice[];
}>;

export type Dish = Readonly<{
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  options: readonly DishOption[];
}>;

export type RestaurantDetail = RestaurantSummary &
  Readonly<{
    dishes: readonly Dish[];
  }>;

export type CatalogPage<T> = Readonly<{
  items: readonly T[];
  page: number;
  totalPages: number;
  totalResults: number;
}>;

export type CatalogSearch = Readonly<{
  query?: string;
  category?: string;
  page: number;
}>;
