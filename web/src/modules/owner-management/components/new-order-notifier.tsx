import { useEffect, useMemo, useState } from "react";

import {
  createOwnerPendingRealtimeAdapter,
  type Order,
  type OrderConnectionState,
  type OrderRepository,
  type OrderSubscriptionPort,
} from "../../orders";
import { Button, ConnectionBanner, formatUsd } from "../../../shared/ui";
import { createPendingOrderNotifier, type PendingOrderToast } from "../model/pending-notifier";

export type NewOrderNotifierProps = Readonly<{
  orders: readonly Order[];
  repository: Pick<OrderRepository, "list">;
  subscriptions: Pick<OrderSubscriptionPort, "ownerPendingOrders">;
  replaceOrders: (orders: readonly Order[]) => void;
  onPendingCount: (count: number) => void;
  onViewOrder: (orderId: string) => void;
  retry?: (attempt: number) => Promise<void>;
}>;

export function NewOrderNotifier({
  orders,
  repository,
  subscriptions,
  replaceOrders,
  onPendingCount,
  onViewOrder,
  retry,
}: NewOrderNotifierProps) {
  const [toasts, setToasts] = useState<readonly PendingOrderToast[]>([]);
  const [connection, setConnection] = useState<OrderConnectionState>("connecting");
  const notifier = useMemo(
    () => createPendingOrderNotifier({ onToasts: setToasts, onPendingCount }),
    [onPendingCount],
  );

  useEffect(() => {
    notifier.sync(orders);
  }, [notifier, orders]);

  useEffect(() => {
    let current = orders;
    const subscription = createOwnerPendingRealtimeAdapter({
      subscriptions: subscriptions as OrderSubscriptionPort,
      repository,
      getCurrent: () => current,
      replace: (next) => {
        current = next;
        replaceOrders(next);
        notifier.sync(next, true);
      },
      onNewOrder: notifier.receive,
      onConnectionState: setConnection,
      retry,
    });
    void subscription.start();
    return () => {
      notifier.dispose();
      void subscription.dispose();
    };
  }, [notifier, orders, replaceOrders, repository, retry, subscriptions]);

  return (
    <>
      {connection === "reconnecting" ? (
        <ConnectionBanner message="Live order updates are reconnecting…" />
      ) : null}
      <div className="owner-order-toasts" aria-label="New orders">
        {toasts.map((toast) => (
          <article className="owner-order-toast" key={toast.id} role="status">
            <div>
              <strong>New order from {toast.restaurantName}</strong>
              <p>
                Order #{toast.shortId} · {formatUsd(toast.totalMinor)}
              </p>
            </div>
            <Button onClick={() => onViewOrder(toast.id)} size="sm">
              View order
            </Button>
            <Button
              aria-label={`Dismiss order ${toast.shortId}`}
              onClick={() => notifier.dismiss(toast.id)}
              size="sm"
              variant="tertiary"
            >
              Dismiss
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
