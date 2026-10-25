import { message as localizedMessage, resolveMessage } from "../../../shared/i18n";
import { ORDER_STATUS_LABELS } from "./status-machine";
import type { Order } from "./types";

const customerMessages: Readonly<Record<Order["status"], string>> = {
  PENDING: localizedMessage("orders.notificationPending"),
  COOKING: localizedMessage("orders.notificationCooking"),
  WAITING: localizedMessage("orders.notificationWaiting"),
  PICKED: localizedMessage("orders.notificationPicked"),
  DELIVERED: localizedMessage("orders.notificationDelivered"),
};

export type CustomerOrderNotification = Readonly<{
  title: string;
  description: string;
}>;

export function createCustomerOrderStatusNotifier(
  notify: (notification: CustomerOrderNotification) => void,
  resolve: (value: string) => string = resolveMessage,
): (order: Order) => void {
  const seen = new Set<string>();
  return (order) => {
    const key = `${order.id}:${order.status}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    notify({
      title: resolve(ORDER_STATUS_LABELS[order.status]),
      description: resolve(customerMessages[order.status]),
    });
  };
}
