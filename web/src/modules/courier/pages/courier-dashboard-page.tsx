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
import type {
  Order,
  OrderConnectionState,
  OrderSubscriptionPort,
} from "../../orders";
import type { CourierRepository } from "../api/courier-repository";
import { ActiveDeliveryCard } from "../components/active-delivery-card";
import { AvailableOrderCard } from "../components/available-order-card";
import { selectActiveDelivery } from "../model/active-delivery";
import {
  mergeAvailableOrders,
  removeAvailableOrder,
} from "../model/available-orders";
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<OrderConnectionState>("connecting");
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
      onConnectionState: setConnectionState,
    });
    void realtime.start();
    return () => {
      void realtime.dispose();
    };
  }, [replaceAvailable, repository, subscriptions]);

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
      notifier.info("This order was accepted by another courier.");
      focusAfterRemoval(order.id);
      return;
    }
    if (result.kind === "already-active") {
      const activeOrders = await repository.listOrders("PICKED");
      setData((current) => current && { ...current, activeOrders });
      notifier.info("You already have an active delivery.");
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
    notifier.error("We couldn’t accept this order. Try again.");
  };

  if (!data && !loadError) {
    return <main aria-label="Loading courier dashboard"><Skeleton /><Skeleton /><Skeleton /></main>;
  }
  if (!data && loadError) {
    return (
      <main className="courier-dashboard">
        <ErrorState action={{ label: "Try again", onClick: load }} title="We couldn’t load the courier dashboard." />
      </main>
    );
  }

  const readyData = data as DashboardData;
  const selection = selectActiveDelivery(readyData.activeOrders);
  const acceptsDisabled = selection.active !== null || selection.hasInvariantError;
  const disabledReason = selection.hasInvariantError
    ? "Multiple active deliveries need attention."
    : selection.active
      ? "Complete your active delivery before accepting another order."
      : undefined;

  return (
    <main className="courier-dashboard">
      {connectionState === "reconnecting" ? (
        <ConnectionBanner message="New order updates are reconnecting…" />
      ) : null}
      <header className="courier-dashboard__header">
        <div><p className="courier-eyebrow">Courier workspace</p><h1>Courier dashboard</h1></div>
        <Badge tone="success">Online</Badge>
      </header>

      {selection.active ? (
        <ActiveDeliveryCard order={selection.active} onContinue={(order) => onNavigateDelivery(order.id)} />
      ) : null}
      {selection.hasInvariantError ? (
        <p className="courier-invariant" role="alert">Multiple active deliveries need attention.</p>
      ) : null}

      <section aria-labelledby="available-orders-heading">
        <div className="courier-section-heading">
          <h2 id="available-orders-heading">Available orders</h2>
          <Button onClick={load} variant="tertiary">Refresh</Button>
        </div>
        {readyData.available.length === 0 ? (
          <div className="courier-empty-heading" ref={emptyHeadingRef} tabIndex={-1}>
            <EmptyState
              description="New pickup orders will appear here while you’re online."
              title="No orders available"
            />
          </div>
        ) : (
          <div className="courier-available-grid">
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
        <h2 id="recent-deliveries-heading">Recent deliveries</h2>
        {readyData.recent.length === 0 ? (
          <p>No completed deliveries yet.</p>
        ) : (
          <ul className="courier-recent-list">
            {readyData.recent.map((order) => (
              <li key={order.id}>
                <span>{order.restaurant?.name ?? "Restaurant unavailable"}</span>
                <Money minor={order.totalMinor} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

