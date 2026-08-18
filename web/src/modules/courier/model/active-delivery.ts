import type { Order } from "../../orders";

export type ActiveDeliverySelection = Readonly<{
  active: Order | null;
  hasInvariantError: boolean;
}>;

export function selectActiveDelivery(orders: readonly Order[]): ActiveDeliverySelection {
  const active = orders
    .filter((order) => order.status === "PICKED")
    .sort(
      (left, right) =>
        Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || right.id.localeCompare(left.id),
    );
  return {
    active: active[0] ?? null,
    hasInvariantError: active.length > 1,
  };
}
