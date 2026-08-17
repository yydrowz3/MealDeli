import type { OrderRole, OrderStatus } from "./types";
import { ORDER_STATUSES } from "./types";

export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  PENDING: "Order placed",
  COOKING: "Preparing your order",
  WAITING: "Ready for pickup",
  PICKED: "On the way",
  DELIVERED: "Delivered",
};

export const ORDER_STATUS_DESCRIPTIONS: Readonly<Record<OrderStatus, string>> = {
  PENDING: "The restaurant has received this order.",
  COOKING: "The restaurant is preparing this order.",
  WAITING: "The order is ready for a courier.",
  PICKED: "The courier is delivering this order.",
  DELIVERED: "This order has been delivered.",
};

const roleTargets: Readonly<Record<OrderRole, readonly OrderStatus[]>> = {
  CUSTOMER: [],
  OWNER: ["COOKING", "WAITING"],
  COURIER: ["PICKED", "DELIVERED"],
};

export function getOrderStatusRank(status: OrderStatus): number {
  return ORDER_STATUSES.indexOf(status);
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  return ORDER_STATUSES[getOrderStatusRank(status) + 1] ?? null;
}

export function isAdjacentOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return getNextOrderStatus(from) === to;
}

export function canRoleTransitionOrder(
  role: OrderRole,
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return isAdjacentOrderTransition(from, to) && roleTargets[role].includes(to);
}

export type OrderTimelineStep = Readonly<{
  status: OrderStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
}>;

export function buildOrderTimeline(current: OrderStatus): readonly OrderTimelineStep[] {
  const currentRank = getOrderStatusRank(current);
  return ORDER_STATUSES.map((status, rank) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
    description: ORDER_STATUS_DESCRIPTIONS[status],
    state: rank < currentRank ? "complete" : rank === currentRank ? "current" : "upcoming",
  }));
}
