import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  Button,
  ConnectionBanner,
  ErrorState,
  Modal,
  Money,
  Skeleton,
} from "../../../shared/ui";
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
  renderMap?: (props: Readonly<{
    route: DemoRoute;
    restaurantName: string;
    failed: boolean;
    onTileFailure: () => void;
    onSkipMap: () => void;
  }>) => ReactNode;
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
  const [order, setOrder] = useState<Order | null>(null);
  const orderRef = useRef<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [connectionState, setConnectionState] =
    useState<OrderConnectionState>("connected");
  const detailsRef = useRef<HTMLElement>(null);
  const route = useAtomValue(courierRouteAtom);
  const initializeRoute = useSetAtom(initializeCourierRouteAtom);
  const advanceRoute = useSetAtom(advanceCourierRouteAtom);
  const clearRoute = useSetAtom(clearCourierRouteAtom);
  const reducedMotion = useReducedMotion();
  const activeRouteOrderId = route?.orderId;

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
        setError("Order not found");
        return;
      }
      applyOrder(result.order);
    } catch {
      setError("We couldn’t load this delivery.");
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
        setError("We couldn’t complete the delivery. Try again.");
        setConfirming(false);
      }
    } else {
      setError("We couldn’t complete the delivery. Try again.");
      setConfirming(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <main aria-label="Loading delivery"><Skeleton /><Skeleton /><Skeleton /></main>;
  }
  if (completed) {
    return (
      <main className="courier-completed" aria-live="polite">
        <p className="courier-eyebrow">Order #{orderId.slice(0, 8)}</p>
        <h1>Delivery completed</h1>
        <p>The order is now in your delivery history.</p>
        <Button onClick={onBackDashboard}>Back to dashboard</Button>
      </main>
    );
  }
  if (!order || error === "Order not found") {
    return (
      <main className="courier-delivery-page">
        <ErrorState action={{ label: "Back to dashboard", onClick: onBackDashboard }} title="Order not found" />
      </main>
    );
  }

  const activeRoute = route?.orderId === orderId ? route : null;
  const restaurantName = order.restaurant?.name ?? "Restaurant unavailable";
  const mapProps = activeRoute
    ? {
        route: activeRoute,
        restaurantName,
        failed: mapFailed,
        onTileFailure: () => setMapFailed(true),
        onSkipMap: () => detailsRef.current?.focus(),
      }
    : null;

  return (
    <main className="courier-delivery-page">
      {connectionState === "reconnecting" ? (
        <ConnectionBanner message="Delivery updates are reconnecting…" />
      ) : null}
      {mapFailed ? (
        <div className="courier-map-warning" role="status">
          Map tiles are unavailable. The demo route is still active.
        </div>
      ) : null}
      <div className="courier-delivery-layout">
        <div className="courier-delivery-layout__map">
          {mapProps
            ? renderMap
              ? renderMap(mapProps)
              : <DeliveryMap {...mapProps} />
            : <Skeleton />}
          {reducedMotion && activeRoute ? (
            <Button onClick={() => advanceRoute()} variant="secondary">Advance demo route</Button>
          ) : null}
        </div>

        <section className="courier-delivery-details" ref={detailsRef} tabIndex={-1}>
          <p className="courier-eyebrow">On the way</p>
          <h1>{restaurantName}</h1>
          {order.restaurant ? <p>{order.restaurant.address}</p> : null}
          <h2>Demo delivery destination</h2>
          <p>Location is simulated for this demo.</p>
          <h2>Order summary</h2>
          <ul className="courier-item-list">
            {order.items.map((item) => (
              <li key={item.id}>
                <strong>{item.quantity} × {item.dishName}</strong>
                {item.selectedOptions.length > 0 ? (
                  <details>
                    <summary>Options</summary>
                    {item.selectedOptions.map((option) => (
                      <p key={option.optionId}>{option.name}: {option.choices.map((choice) => choice.name).join(", ")}</p>
                    ))}
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="courier-order-total">Order total <Money minor={order.totalMinor} /></p>
          {error ? <p role="alert">{error}</p> : null}
          <Button disabled={submitting} loading={submitting} onClick={() => setConfirming(true)}>
            Complete delivery
          </Button>
        </section>
      </div>

      <Modal
        dismissible={!submitting}
        footer={
          <>
            <Button disabled={submitting} onClick={() => void complete()} loading={submitting}>Complete delivery</Button>
            <Button disabled={submitting} onClick={() => setConfirming(false)} variant="secondary">Keep delivering</Button>
          </>
        }
        onClose={() => setConfirming(false)}
        open={confirming}
        title="Complete this delivery?"
        description="This will mark the order as delivered."
      >
        <p>Order #{orderId.slice(0, 8)}</p>
      </Modal>
    </main>
  );
}
