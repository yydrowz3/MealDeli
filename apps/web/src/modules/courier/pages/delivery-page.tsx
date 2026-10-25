import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button, ConnectionBanner, ErrorState, Modal, Money, Skeleton } from "../../../shared/ui";
import {
  createOrderRealtimeAdapter,
  type Order,
  type OrderConnectionState,
  type OrderSubscriptionPort,
} from "../../orders";
import type { CourierRepository } from "../api/courier-repository";
import { DeliveryMap } from "../components/delivery-map";
import {
  advanceCourierRouteAtom,
  clearCourierRouteAtom,
  courierRouteAtom,
  initializeCourierRouteAtom,
} from "../model/route-atoms";
import type { DemoRoute } from "../model/demo-route";

export type DeliveryPageProps = Readonly<{
  orderId: string;
  courierId: string;
  repository: CourierRepository;
  subscriptions?: OrderSubscriptionPort;
  onBackDashboard: () => void;
  onAssignmentLost?: () => void;
  renderMap?: (
    props: Readonly<{
      route: DemoRoute;
      restaurantName: string;
      failed: boolean;
      onTileFailure: () => void;
      onSkipMap: () => void;
    }>,
  ) => ReactNode;
}>;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function DeliveryPage({
  orderId,
  courierId,
  repository,
  subscriptions,
  onBackDashboard,
  onAssignmentLost,
  renderMap,
}: DeliveryPageProps) {
  const { t, text, formatNumber } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const orderRef = useRef<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [connectionState, setConnectionState] = useState<OrderConnectionState>("connected");
  const detailsRef = useRef<HTMLElement>(null);
  const route = useAtomValue(courierRouteAtom);
  const initializeRoute = useSetAtom(initializeCourierRouteAtom);
  const advanceRoute = useSetAtom(advanceCourierRouteAtom);
  const clearRoute = useSetAtom(clearCourierRouteAtom);
  const reducedMotion = useReducedMotion();
  const activeRouteOrderId = route?.orderId;

  const skipMap = useCallback(() => {
    const details = detailsRef.current;
    if (!details) return;

    details.scrollIntoView?.({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    details.focus({ preventScroll: true });
  }, [reducedMotion]);

  const finish = useCallback(() => {
    clearRoute();
    setConfirming(false);
    setCompleted(true);
  }, [clearRoute]);

  const loseAssignment = useCallback(() => {
    clearRoute();
    onAssignmentLost?.();
    onBackDashboard();
  }, [clearRoute, onAssignmentLost, onBackDashboard]);

  const applyOrder = useCallback(
    (next: Order) => {
      orderRef.current = next;
      setOrder(next);
      if (next.status === "DELIVERED") finish();
      else if (next.courierId !== courierId || next.status !== "PICKED") loseAssignment();
    },
    [courierId, finish, loseAssignment],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await repository.getOrder(orderId);
      if (result.kind === "not-found") {
        setError(localizedMessage("courier.orderNotFound"));
        return;
      }
      applyOrder(result.order);
    } catch {
      setError(localizedMessage("courier.loadDeliveryFailed"));
    } finally {
      setLoading(false);
    }
  }, [applyOrder, orderId, repository]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order || order.status !== "PICKED" || order.courierId !== courierId) return;
    initializeRoute(orderId);
  }, [courierId, initializeRoute, order, orderId]);

  useEffect(() => {
    if (reducedMotion || completed || !activeRouteOrderId) return;
    const timer = globalThis.setInterval(() => advanceRoute(), 2_000);
    return () => globalThis.clearInterval(timer);
  }, [activeRouteOrderId, advanceRoute, completed, reducedMotion]);

  useEffect(() => {
    if (!subscriptions || !order) return;
    const realtime = createOrderRealtimeAdapter({
      orderId,
      subscriptions,
      repository: { get: repository.getOrder },
      getCurrent: () => orderRef.current ?? order,
      replace: applyOrder,
      onConnectionState: setConnectionState,
    });
    void realtime.start();
    return () => {
      void realtime.dispose();
    };
  }, [applyOrder, order, orderId, repository, subscriptions]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [load]);

  const complete = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await repository.completeOrder(orderId);
    if (result.kind === "success" || result.kind === "already-delivered") {
      finish();
    } else if (result.kind === "assignment-lost") {
      loseAssignment();
    } else if (result.kind === "timeout") {
      const reconciliation = await repository.getOrder(orderId);
      if (reconciliation.kind === "found" && reconciliation.order.status === "DELIVERED") {
        finish();
      } else if (
        reconciliation.kind === "not-found" ||
        reconciliation.order.courierId !== courierId
      ) {
        loseAssignment();
      } else {
        setError(localizedMessage("courier.completeFailed"));
        setConfirming(false);
      }
    } else {
      setError(localizedMessage("courier.completeFailed"));
      setConfirming(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main aria-label={t("courier.loadingDelivery")}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }
  if (completed) {
    return (
      <main className="mx-auto max-w-content px-4 pt-4 pb-24 md:pt-8" aria-live="polite">
        <p className="text-jade-text text-small font-bold uppercase">
          {t("common.orderNumber")}
          {text(orderId.slice(0, 8))}
        </p>
        <h1>{t("courier.completed")}</h1>
        <p>{t("courier.completedHelp")}</p>
        <Button onClick={onBackDashboard}>{t("courier.backToDashboard")}</Button>
      </main>
    );
  }
  if (!order || error === t("courier.orderNotFound")) {
    return (
      <main className="mx-auto max-w-content px-4 pt-4 pb-24 md:pt-8">
        <ErrorState
          action={{ label: t("courier.backToDashboard"), onClick: onBackDashboard }}
          title={t("courier.orderNotFound")}
        />
      </main>
    );
  }

  const activeRoute = route?.orderId === orderId ? route : null;
  const restaurantName = order.restaurant?.name ?? t("common.restaurantUnavailable");
  const mapProps = activeRoute
    ? {
        route: activeRoute,
        restaurantName,
        failed: mapFailed,
        onTileFailure: () => setMapFailed(true),
        onSkipMap: skipMap,
      }
    : null;

  return (
    <main className="mx-auto max-w-content px-4 pt-4 pb-24 md:pt-8">
      {connectionState === "reconnecting" ? (
        <ConnectionBanner message={t("courier.reconnectingDelivery")} />
      ) : null}
      {mapFailed ? (
        <div
          className="border border-warning rounded-control bg-warning-soft text-warning-text px-4 py-3"
          role="status"
        >
          {t("courier.tilesUnavailable")}
        </div>
      ) : null}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div>
          {mapProps ? (
            renderMap ? (
              renderMap(mapProps)
            ) : (
              <DeliveryMap {...mapProps} />
            )
          ) : (
            <Skeleton />
          )}
          {reducedMotion && activeRoute ? (
            <Button onClick={() => advanceRoute()} variant="secondary">
              {t("courier.advanceRoute")}
            </Button>
          ) : null}
        </div>

        <section
          className="grid gap-4 border border-border rounded-card p-5 bg-surface"
          ref={detailsRef}
          tabIndex={-1}
        >
          <p className="text-jade-text text-small font-bold uppercase">
            {t("orders.picked")}
          </p>
          <h1>{text(restaurantName)}</h1>
          {order.restaurant ? <p>{text(order.restaurant.address)}</p> : null}
          <h2>{t("courier.destination")}</h2>
          <p>{t("courier.simulatedLocation")}</p>
          <h2>{t("common.orderSummary")}</h2>
          <ul className="list-none p-0">
            {order.items.map((item) => (
              <li
                className="flex justify-between gap-4 border-b border-b-border py-3"
                key={item.id}
              >
                <strong>
                  {formatNumber(item.quantity)} × {text(item.dishName)}
                </strong>
                {item.selectedOptions.length > 0 ? (
                  <details>
                    <summary>{t("common.options")}</summary>
                    {item.selectedOptions.map((option) => (
                      <p key={option.optionId}>
                        {text(option.name)}:{" "}
                        {option.choices.map((choice) => choice.name).join(", ")}
                      </p>
                    ))}
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="flex justify-between font-bold">
            {t("common.orderTotal")}
            <Money minor={order.totalMinor} />
          </p>
          {error ? <p role="alert">{text(error)}</p> : null}
          <Button disabled={submitting} loading={submitting} onClick={() => setConfirming(true)}>
            {t("courier.complete")}
          </Button>
        </section>
      </div>

      <Modal
        dismissible={!submitting}
        footer={
          <>
            <Button disabled={submitting} onClick={() => void complete()} loading={submitting}>
              {t("courier.complete")}
            </Button>
            <Button disabled={submitting} onClick={() => setConfirming(false)} variant="secondary">
              {t("courier.keepDelivering")}
            </Button>
          </>
        }
        onClose={() => setConfirming(false)}
        open={confirming}
        title={t("courier.confirmComplete")}
        description={t("courier.confirmCompleteHelp")}
      >
        <p>
          {t("common.orderNumber")}
          {text(orderId.slice(0, 8))}
        </p>
      </Modal>
    </main>
  );
}
