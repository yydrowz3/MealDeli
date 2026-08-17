import { z } from "zod";

import { useFragment as readFragment, type FragmentType } from "../../../gql";
import {
  OrdersDetailFragmentDoc,
  OrdersItemFragmentDoc,
  OrdersRestaurantFragmentDoc,
  OrdersSummaryFragmentDoc,
} from "../../../gql/graphql";
import type {
  Order,
  OrderDetailResult,
  OrderItemOption,
  OrderRealtimeEvent,
  OrdersDiagnostic,
} from "../model/types";

const statusSchema = z.enum(["PENDING", "COOKING", "WAITING", "PICKED", "DELIVERED"]);
const timestampSchema = z.union([z.string(), z.date()]).transform((value, context) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({ code: "custom", message: "Invalid order timestamp" });
    return z.NEVER;
  }
  return value instanceof Date ? value.toISOString() : value;
});

const optionChoiceSchema = z.object({
  choiceId: z.string(),
  name: z.string(),
  extraMinor: z.number().int(),
});
const optionSchema = z.object({
  optionId: z.string(),
  name: z.string(),
  choices: z.array(optionChoiceSchema),
});

const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  image: z.string().nullable().optional(),
});

const orderItemBaseSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  dishId: z.string(),
  dishName: z.string(),
  quantity: z.number().int().positive(),
  lineTotalMinor: z.number().int(),
  selectedOptions: z.unknown().optional(),
});

const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  courierId: z.string().nullable().optional(),
  restaurantId: z.string(),
  restaurant: restaurantSchema.nullable().optional(),
  status: statusSchema,
  totalMinor: z.number().int(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  items: z.array(orderItemBaseSchema).nullable().optional(),
});

function adaptSelectedOptions(
  value: unknown,
  orderId: string,
  itemId: string,
  diagnostic?: OrdersDiagnostic,
): readonly OrderItemOption[] {
  const result = z.array(optionSchema).safeParse(value ?? []);
  if (result.success) {
    return result.data;
  }
  diagnostic?.("Invalid order option snapshot; using an empty selection.", {
    orderId,
    itemId,
  });
  return [];
}

export function adaptOrder(value: unknown, diagnostic?: OrdersDiagnostic): Order {
  const parsed = orderSchema.parse(value);
  return {
    id: parsed.id,
    customerId: parsed.customerId,
    courierId: parsed.courierId ?? null,
    restaurantId: parsed.restaurantId,
    restaurant: parsed.restaurant
      ? { ...parsed.restaurant, image: parsed.restaurant.image ?? null }
      : null,
    status: parsed.status,
    totalMinor: parsed.totalMinor,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    items: (parsed.items ?? [])
      .map((item) => ({
        id: item.id,
        position: item.position,
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
        lineTotalMinor: item.lineTotalMinor,
        selectedOptions: adaptSelectedOptions(
          item.selectedOptions,
          parsed.id,
          item.id,
          diagnostic,
        ),
      }))
      .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id)),
  };
}

export function adaptOrderRealtimeEvent(
  value: unknown,
  diagnostic?: OrdersDiagnostic,
): OrderRealtimeEvent {
  const order = adaptOrder(value, diagnostic);
  const record =
    value && typeof value === "object"
      ? (value as Readonly<Record<string, unknown>>)
      : {};
  return {
    ...order,
    restaurant: Object.hasOwn(record, "restaurant")
      ? record.restaurant === null
        ? null
        : order.restaurant
      : undefined,
    items: Object.hasOwn(record, "items")
      ? record.items === null
        ? null
        : order.items
      : undefined,
  };
}

function unmaskOrderSummary(
  value: FragmentType<typeof OrdersSummaryFragmentDoc>,
): Readonly<Record<string, unknown>> {
  const summary = readFragment(OrdersSummaryFragmentDoc, value);
  return {
    ...summary,
    restaurant: readFragment(OrdersRestaurantFragmentDoc, summary.restaurant),
    items: readFragment(OrdersItemFragmentDoc, summary.items),
  };
}

export function adaptOrderSummaryFragment(
  value: FragmentType<typeof OrdersSummaryFragmentDoc>,
  diagnostic?: OrdersDiagnostic,
): Order {
  return adaptOrder(unmaskOrderSummary(value), diagnostic);
}

export function adaptOrderSummaryFragments(
  values: readonly FragmentType<typeof OrdersSummaryFragmentDoc>[],
  diagnostic?: OrdersDiagnostic,
): readonly Order[] {
  return values
    .map((value) => adaptOrderSummaryFragment(value, diagnostic))
    .sort(
      (left, right) =>
        Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id),
    );
}

function unmaskOrderDetail(
  value: FragmentType<typeof OrdersDetailFragmentDoc>,
): Readonly<Record<string, unknown>> {
  const detail = readFragment(OrdersDetailFragmentDoc, value);
  return unmaskOrderSummary(detail);
}

export function adaptOrderDetailFragment(
  value: FragmentType<typeof OrdersDetailFragmentDoc>,
  diagnostic?: OrdersDiagnostic,
): Order {
  return adaptOrder(unmaskOrderDetail(value), diagnostic);
}

export function adaptOrderDetailRealtimeFragment(
  value: FragmentType<typeof OrdersDetailFragmentDoc>,
  diagnostic?: OrdersDiagnostic,
): OrderRealtimeEvent {
  return adaptOrderRealtimeEvent(unmaskOrderDetail(value), diagnostic);
}

export function adaptOrders(value: unknown, diagnostic?: OrdersDiagnostic): readonly Order[] {
  return z
    .array(z.unknown())
    .parse(value)
    .map((order) => adaptOrder(order, diagnostic))
    .sort(
      (left, right) =>
        Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id),
    );
}

export function adaptOrderDetailOutput(
  output: Readonly<{ ok: boolean; error?: string | null; order?: unknown }> | null | undefined,
  diagnostic?: OrdersDiagnostic,
): OrderDetailResult {
  if (!output?.ok || !output.order) {
    return { kind: "not-found" };
  }
  return { kind: "found", order: adaptOrder(output.order, diagnostic) };
}
