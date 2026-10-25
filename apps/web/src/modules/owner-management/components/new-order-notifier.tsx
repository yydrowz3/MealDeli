import { useI18n } from "../../../shared/i18n";
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
  const { t, text, locale } = useI18n();
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
        <ConnectionBanner message={t("ui.liveOrdersReconnecting")} />
      ) : null}
      <div
        className="fixed right-6 bottom-6 z-60 grid max-w-104 gap-3 max-md:right-4 max-md:bottom-4 max-md:left-4 max-md:max-w-none"
        aria-label={t("owner.newOrders")}
      >
        {toasts.map((toast) => (
          <article
            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-card border border-border bg-surface p-4 [box-shadow:var(--shadow-lg)]"
            key={toast.id}
            role="status"
          >
            <div>
              <strong>{t("owner.newOrderRestaurant", { name: text(toast.restaurantName) })}</strong>
              <p className="mx-0 mt-1 mb-0">
                {t("common.orderNumber")}
                {text(toast.shortId)} · {formatUsd(toast.totalMinor, locale)}
              </p>
            </div>
            <Button onClick={() => onViewOrder(toast.id)} size="sm">
              {t("common.viewOrder")}
            </Button>
            <Button
              aria-label={t("owner.dismissOrder", { id: toast.shortId })}
              onClick={() => notifier.dismiss(toast.id)}
              size="sm"
              variant="tertiary"
            >
              {t("common.dismiss")}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
