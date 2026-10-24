import { ORDER_STATUS_LABELS } from "./status-machine";
import type { Order } from "./types";

const customerMessages: Readonly<Record<Order["status"], string>> = {
  PENDING: "Your order was placed.",
  COOKING: "The restaurant started preparing your order.",
  WAITING: "Your order is ready for pickup.",
  PICKED: "Your order is on the way.",
  DELIVERED: "Your order was delivered.",
};

export type CustomerOrderNotification = Readonly<{
  title: string;
  description: string;
}>;

export function createCustomerOrderStatusNotifier(
  notify: (notification: CustomerOrderNotification) => void,
): (order: Order) => void {
  const seen = new Set<string>();
  return (order) => {
    const key = `${order.id}:${order.status}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    notify({
      title: ORDER_STATUS_LABELS[order.status],
      description: customerMessages[order.status],
    });
  };
}
