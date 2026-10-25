import { useI18n } from "../../../shared/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Badge,
  Button,
  ConnectionBanner,
  EmptyState,
  ErrorState,
  Money,
  Skeleton,
  toastAdapter,
} from "../../../shared/ui";
import type { Order, OrderConnectionState, OrderSubscriptionPort } from "../../orders";
import type { CourierRepository } from "../api/courier-repository";
import { ActiveDeliveryCard } from "../components/active-delivery-card";
import { AvailableOrderCard } from "../components/available-order-card";
import { selectActiveDelivery } from "../model/active-delivery";
import { mergeAvailableOrders, removeAvailableOrder } from "../model/available-orders";
import { createCourierAvailableRealtimeAdapter } from "../model/realtime";

export type CourierNotifier = Readonly<{
  info(message: string): void;
  error(message: string): void;
}>;

export type CourierDashboardPageProps = Readonly<{
  repository: CourierRepository;
  subscriptions?: OrderSubscriptionPort;
  notifier?: CourierNotifier;
  onNavigateDelivery: (orderId: string) => void;
}>;

type DashboardData = Readonly<{
  available: readonly Order[];
  activeOrders: readonly Order[];
  recent: readonly Order[];
}>;

export function CourierDashboardPage({
  repository,
  subscriptions,
  notifier = toastAdapter,
  onNavigateDelivery,
}: CourierDashboardPageProps) {
  const { t, text } = useI18n();
  const translateRef = useRef(t);
  translateRef.current = t;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<OrderConnectionState>("connecting");
  const availableRef = useRef<readonly Order[]>([]);
  const headingRefs = useRef(new Map<string, HTMLHeadingElement>());
  const emptyHeadingRef = useRef<HTMLHeadingElement>(null);

  const replaceAvailable = useCallback((available: readonly Order[]) => {
    availableRef.current = available;
    setData((current) => current && { ...current, available });
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [available, activeOrders, recent] = await Promise.all([
        repository.availableOrders(),
        repository.listOrders("PICKED"),
        repository.listOrders("DELIVERED"),
      ]);
      const next = {
        available: mergeAvailableOrders([], available),
        activeOrders,
        recent: [...recent]
          .sort(
            (left, right) =>
              Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
              right.id.localeCompare(left.id),
          )
          .slice(0, 3),
      };
      availableRef.current = next.available;
      setData(next);
    } catch {
      setLoadError(true);
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!subscriptions) {
      setConnectionState("connected");
      return;
    }
    const realtime = createCourierAvailableRealtimeAdapter({
      subscriptions,
      refetch: repository.availableOrders,
      getCurrent: () => availableRef.current,
      replace: replaceAvailable,
      onNewOrder: () => notifier.info(translateRef.current("courier.newOrder")),
      onConnectionState: setConnectionState,
    });
    void realtime.start();
    return () => {
      void realtime.dispose();
    };
  }, [notifier, replaceAvailable, repository, subscriptions]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [load]);

  const focusAfterRemoval = (removedId: string) => {
    const remaining = availableRef.current.filter((order) => order.id !== removedId);
    globalThis.setTimeout(() => {
      if (remaining[0]) headingRefs.current.get(remaining[0].id)?.focus();
      else emptyHeadingRef.current?.focus();
    }, 0);
  };

  const accept = async (order: Order) => {
    if (acceptingId) return;
    setAcceptingId(order.id);
    const result = await repository.takeOrder(order.id);
    setAcceptingId(null);

    if (result.kind === "success") {
      replaceAvailable(removeAvailableOrder(availableRef.current, order.id));
      onNavigateDelivery(order.id);
      return;
    }
    if (result.kind === "no-longer-available") {
      replaceAvailable(removeAvailableOrder(availableRef.current, order.id));
      notifier.info(t("courier.alreadyAccepted"));
      focusAfterRemoval(order.id);
      return;
    }
    if (result.kind === "already-active") {
      const activeOrders = await repository.listOrders("PICKED");
      setData((current) => current && { ...current, activeOrders });
      notifier.info(t("courier.alreadyActive"));
      return;
    }
    if (result.kind === "timeout") {
      const [available, activeOrders] = await Promise.all([
        repository.availableOrders(),
        repository.listOrders("PICKED"),
      ]);
      replaceAvailable(mergeAvailableOrders([], available));
      setData((current) => current && { ...current, activeOrders });
      if (activeOrders.some((active) => active.id === order.id)) {
        onNavigateDelivery(order.id);
        return;
      }
    }
    notifier.error(t("courier.acceptFailed"));
  };

  if (!data && !loadError) {
    return (
      <main aria-label={t("courier.loadingDashboard")}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }
  if (!data && loadError) {
    return (
      <main className="mx-auto max-w-content px-4 pt-4 pb-24 md:pt-8">
        <ErrorState
          action={{ label: t("common.tryAgain"), onClick: load }}
          title={t("courier.loadDashboardFailed")}
        />
      </main>
    );
  }

  const readyData = data as DashboardData;
  const selection = selectActiveDelivery(readyData.activeOrders);
  const acceptsDisabled = selection.active !== null || selection.hasInvariantError;
  const disabledReason = selection.hasInvariantError
    ? t("courier.multipleActive")
    : selection.active
      ? t("courier.completeFirst")
      : undefined;

  return (
    <main className="mx-auto max-w-content px-4 pt-4 pb-24 md:pt-8">
      {connectionState === "reconnecting" ? (
        <ConnectionBanner message={t("courier.reconnectingOrders")} />
      ) : null}
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-jade-text text-small font-bold uppercase">
            {t("courier.workspace")}
          </p>
          <h1>{t("courier.dashboard")}</h1>
        </div>
        <Badge tone="success">{t("courier.online")}</Badge>
      </header>

      {selection.active ? (
        <ActiveDeliveryCard
          order={selection.active}
          onContinue={(order) => onNavigateDelivery(order.id)}
        />
      ) : null}
      {selection.hasInvariantError ? (
        <p
          className="border border-warning rounded-control bg-warning-soft text-warning-text px-4 py-3"
          role="alert"
        >
          {t("courier.multipleActive")}
        </p>
      ) : null}

      <section aria-labelledby="available-orders-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="available-orders-heading">{t("courier.availableOrders")}</h2>
          <Button onClick={load} variant="tertiary">
            {t("common.refresh")}
          </Button>
        </div>
        {readyData.available.length === 0 ? (
          <div ref={emptyHeadingRef} tabIndex={-1}>
            <EmptyState
              description={t("courier.emptyOrdersHelp")}
              title={t("courier.emptyOrders")}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {readyData.available.map((order) => (
              <AvailableOrderCard
                accepting={acceptingId === order.id}
                disabled={acceptsDisabled}
                disabledReason={disabledReason}
                headingRef={(element) => {
                  if (element) headingRefs.current.set(order.id, element);
                  else headingRefs.current.delete(order.id);
                }}
                key={order.id}
                onAccept={accept}
                order={order}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="recent-deliveries-heading">
        <h2 id="recent-deliveries-heading">{t("courier.recentDeliveries")}</h2>
        {readyData.recent.length === 0 ? (
          <p>{t("courier.noCompleted")}</p>
        ) : (
          <ul className="list-none p-0">
            {readyData.recent.map((order) => (
              <li
                className="flex justify-between gap-4 border-b border-b-border py-3"
                key={order.id}
              >
                <span>{text(order.restaurant?.name ?? t("common.restaurantUnavailable"))}</span>
                <Money minor={order.totalMinor} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
