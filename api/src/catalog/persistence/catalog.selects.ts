import { Prisma } from '@/generated/prisma/client';

export const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  coverImageUrl: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      restaurants: true,
    },
  },
} as const satisfies Prisma.CategorySelect;

export const DISH_SELECT = {
  id: true,
  name: true,
  description: true,
  priceMinor: true,
  photoUrl: true,
  options: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DishSelect;

export const RESTAURANT_SELECT = {
  id: true,
  name: true,
  address: true,
  coverImageUrl: true,
  promotedUntil: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: CATEGORY_SELECT,
  },
} as const satisfies Prisma.RestaurantSelect;

export type CategoryRecord = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_SELECT;
}>;

export type DishRecord = Prisma.DishGetPayload<{
  select: typeof DISH_SELECT;
}>;

export type RestaurantRecord = Prisma.RestaurantGetPayload<{
  select: typeof RESTAURANT_SELECT;
}>;
