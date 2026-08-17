import type { Order } from "../../orders";

export type PendingOrderToast = Readonly<{
  id: string;
  restaurantName: string;
  shortId: string;
  totalMinor: number;
}>;

export type PendingOrderNotifier = Readonly<{
  receive(order: Order): void;
  sync(orders: readonly Order[], notifyMissing?: boolean): void;
  dismiss(orderId: string): void;
  dispose(): void;
}>;

export function createPendingOrderNotifier(
  options: Readonly<{
    onToasts: (toasts: readonly PendingOrderToast[]) => void;
    onPendingCount: (count: number) => void;
  }>,
): PendingOrderNotifier {
  const active = new Map<string, PendingOrderToast>();
  const known = new Set<string>();
  const dismissed = new Set<string>();

  const publish = () => options.onToasts([...active.values()]);
  const toToast = (order: Order): PendingOrderToast => ({
    id: order.id,
    restaurantName: order.restaurant?.name ?? "your restaurant",
    shortId: order.id.slice(-8).toUpperCase(),
    totalMinor: order.totalMinor,
  });

  const receive = (order: Order) => {
    if (order.status !== "PENDING" || known.has(order.id) || dismissed.has(order.id)) return;
    known.add(order.id);
    active.set(order.id, toToast(order));
    publish();
  };

  return {
    receive,
    sync(orders, notifyMissing = false) {
      const pending = orders.filter((order) => order.status === "PENDING");
      const pendingIds = new Set(pending.map((order) => order.id));
      for (const id of active.keys()) {
        if (!pendingIds.has(id)) active.delete(id);
      }
      for (const id of dismissed) {
        if (!pendingIds.has(id)) dismissed.delete(id);
      }
      if (notifyMissing) pending.forEach(receive);
      else pending.forEach((order) => known.add(order.id));
      options.onPendingCount(pendingIds.size);
      publish();
    },
    dismiss(orderId) {
      dismissed.add(orderId);
      active.delete(orderId);
      publish();
    },
    dispose() {
      active.clear();
      known.clear();
      dismissed.clear();
      options.onPendingCount(0);
      publish();
    },
  };
}
