import { useEffect, useMemo, useRef, useState } from "react";

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
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const notifier = useMemo(
    () => createPendingOrderNotifier({ onToasts: setToasts, onPendingCount }),
    [onPendingCount],
  );

  useEffect(() => {
    notifier.sync(orders);
  }, [notifier, orders]);

  useEffect(() => {
    const subscription = createOwnerPendingRealtimeAdapter({
      subscriptions: subscriptions as OrderSubscriptionPort,
      repository,
      getCurrent: () => ordersRef.current,
      replace: (next) => {
        ordersRef.current = next;
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
  }, [notifier, replaceOrders, repository, retry, subscriptions]);

  return (
    <>
      {connection === "reconnecting" ? (
        <ConnectionBanner message="Live order updates are reconnecting…" />
      ) : null}
      <div
        className="fixed right-6 bottom-6 z-60 grid max-w-104 gap-3 [@media(max-width:47.99rem)]:right-4 [@media(max-width:47.99rem)]:bottom-4 [@media(max-width:47.99rem)]:left-4 [@media(max-width:47.99rem)]:max-w-none"
        aria-label="New orders"
      >
        {toasts.map((toast) => (
          <article
            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-solid border-border bg-surface p-4 [box-shadow:var(--shadow-lg)]"
            key={toast.id}
            role="status"
          >
            <div>
              <strong>New order from {toast.restaurantName}</strong>
              <p className="mx-0 mt-1 mb-0">
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
