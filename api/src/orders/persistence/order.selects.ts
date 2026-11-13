import { Prisma } from '@/generated/prisma/client';

export const ORDER_PARTY_SELECT = {
  id: true,
  email: true,
} as const satisfies Prisma.UserSelect;

export const ORDER_RESTAURANT_SELECT = {
  id: true,
  name: true,
  address: true,
} as const satisfies Prisma.RestaurantSelect;

export const ORDERABLE_DISH_SELECT = {
  id: true,
  name: true,
  priceMinor: true,
  options: true,
} as const satisfies Prisma.DishSelect;

export const ORDER_ITEM_SELECT = {
  id: true,
  dishId: true,
  dishName: true,
  basePriceMinor: true,
  selectedOptions: true,
  optionsExtraMinor: true,
  lineTotalMinor: true,
} as const satisfies Prisma.OrderItemSelect;

export const ORDER_SELECT = {
  id: true,
  status: true,
  totalMinor: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: ORDER_PARTY_SELECT,
  },
  courier: {
    select: ORDER_PARTY_SELECT,
  },
  restaurant: {
    select: ORDER_RESTAURANT_SELECT,
  },
  items: {
    select: ORDER_ITEM_SELECT,
    orderBy: { position: 'asc' },
  },
} as const satisfies Prisma.OrderSelect;

export const AVAILABLE_COOKED_ORDER_SELECT = {
  id: true,
  status: true,
  version: true,
  createdAt: true,
  restaurant: {
    select: ORDER_RESTAURANT_SELECT,
  },
} as const satisfies Prisma.OrderSelect;

export type OrderableDishRecord = Prisma.DishGetPayload<{
  select: typeof ORDERABLE_DISH_SELECT;
}>;

export type OrderRecord = Prisma.OrderGetPayload<{
  select: typeof ORDER_SELECT;
}>;

export type AvailableCookedOrderRecord = Prisma.OrderGetPayload<{
  select: typeof AVAILABLE_COOKED_ORDER_SELECT;
}>;
