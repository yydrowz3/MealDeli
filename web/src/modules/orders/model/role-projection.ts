import type { Order, OrderRole, OrderStatus } from "./types";

export type OwnerOrderFilters = Readonly<{
  restaurantId?: string;
  status?: OrderStatus;
}>;

export type OrderSection = Readonly<{
  id: "current" | "past" | "all" | "active" | "completed";
  label: string;
  orders: readonly Order[];
}>;

export function sortOrdersNewestFirst(orders: readonly Order[]): readonly Order[] {
  return [...orders].sort(
    (left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id),
  );
}

export function projectOrdersForRole(
  orders: readonly Order[],
  role: OrderRole,
  ownerFilters: OwnerOrderFilters = {},
): readonly OrderSection[] {
  const sorted = sortOrdersNewestFirst(orders);

  if (role === "CUSTOMER") {
    return [
      {
        id: "current",
        label: "Current",
        orders: sorted.filter((order) => order.status !== "DELIVERED"),
      },
      {
        id: "past",
        label: "Past",
        orders: sorted.filter((order) => order.status === "DELIVERED"),
      },
    ];
  }

  if (role === "COURIER") {
    return [
      {
        id: "active",
        label: "Active",
        orders: sorted.filter((order) => order.status === "PICKED"),
      },
      {
        id: "completed",
        label: "Completed",
        orders: sorted.filter((order) => order.status === "DELIVERED"),
      },
    ];
  }

  return [
    {
      id: "all",
      label: "All orders",
      orders: sorted.filter(
        (order) =>
          (!ownerFilters.restaurantId || order.restaurantId === ownerFilters.restaurantId) &&
          (!ownerFilters.status || order.status === ownerFilters.status),
      ),
    },
  ];
}
