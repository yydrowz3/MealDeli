import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cartAtom,
  CheckoutPage,
  loadCheckout,
  type CheckoutLoadResult,
} from "../../modules/checkout";
import { sessionUserAtom } from "../../modules/identity";
import {
  OrderDetailPage,
  OrdersPage,
  type Order,
  type OrderDetailPageState,
  type OrdersPageState,
} from "../../modules/orders";
import { OwnerOrdersAction } from "../../modules/owner-management";
import { Skeleton } from "../../shared/ui";
import { getMealDeliRuntime } from "./app-runtime";

function upsertOrder(orders: readonly Order[], order: Order): readonly Order[] {
  return [order, ...orders.filter((candidate) => candidate.id !== order.id)];
}

export function OrdersRouteContent() {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  const [state, setState] = useState<OrdersPageState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", orders: await runtime.orderRepository.list() });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "The orders request failed.",
      });
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user || user.role === "CUSTOMER") return;
    let active = true;
    const stream =
      user.role === "OWNER"
        ? runtime.orderSubscriptions.ownerPendingOrders()
        : runtime.orderSubscriptions.courierReadyOrders();
    void (async () => {
      try {
        for await (const event of stream) {
          if (!active) break;
          const result = await runtime.orderRepository.get(event.id);
          if (result.kind === "found") {
            setState((current) =>
              current.kind === "ready"
                ? { kind: "ready", orders: upsertOrder(current.orders, result.order) }
                : current,
            );
          }
        }
      } catch {
        if (active) void load();
      }
    })();
    return () => {
      active = false;
    };
  }, [load, runtime, user]);

  const restaurants = useMemo(
    () =>
      state.kind === "ready"
        ? Array.from(
            new Map(
              state.orders
                .filter((order) => order.restaurant)
                .map((order) => [order.restaurantId, order.restaurant!.name]),
            ),
            ([id, name]) => ({ id, name }),
          )
        : [],
    [state],
  );
  const role = user?.role ?? "CUSTOMER";

  return (
    <OrdersPage
      onRetry={() => void load()}
      onViewOrder={(order) => window.location.assign(`/orders/${order.id}`)}
      renderAction={
        role === "OWNER"
          ? (order) => (
              <OwnerOrdersAction
                onOrder={(next) =>
                  setState((current) =>
                    current.kind === "ready"
                      ? { kind: "ready", orders: upsertOrder(current.orders, next) }
                      : current,
                  )
                }
                order={order}
                repository={runtime.orderRepository}
              />
            )
          : undefined
      }
      restaurants={restaurants}
      role={role}
      state={state}
    />
  );
}

export function OrderDetailRouteContent({ orderId }: Readonly<{ orderId: string }>) {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  const [state, setState] = useState<OrderDetailPageState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const result = await runtime.orderRepository.get(orderId);
      setState(result.kind === "found" ? { kind: "ready", order: result.order } : { kind: "not-found" });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : undefined });
    }
  }, [orderId, runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        for await (const event of runtime.orderSubscriptions.orderUpdates(orderId)) {
          if (!active) break;
          const result = await runtime.orderRepository.get(event.id);
          if (active && result.kind === "found") setState({ kind: "ready", order: result.order });
        }
      } catch {
        if (active) void load();
      }
    })();
    return () => {
      active = false;
    };
  }, [load, orderId, runtime]);

  const role = user?.role ?? "CUSTOMER";
  return (
    <OrderDetailPage
      actionSlot={
        role === "OWNER" && state.kind === "ready" ? (
          <OwnerOrdersAction
            onOrder={(order) => setState({ kind: "ready", order })}
            order={state.order}
            repository={runtime.orderRepository}
          />
        ) : undefined
      }
      onBack={() => window.location.assign("/orders")}
      onRetry={() => void load()}
      role={role}
      state={state}
    />
  );
}

export function CheckoutRouteContent() {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  const cart = useAtomValue(cartAtom);
  const [state, setState] = useState<CheckoutLoadResult | null>(null);

  useEffect(() => {
    let active = true;
    setState(null);
    void loadCheckout({ user, cart, catalog: runtime.catalogRepository }).then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [cart, runtime, user]);

  if (!state) return <Skeleton style={{ height: "28rem" }} />;
  return (
    <CheckoutPage
      identityRepository={runtime.identityRepository}
      onBrowseRestaurants={() => window.location.assign("/restaurants")}
      onOrderCreated={(orderId) => window.location.assign(`/orders/${orderId}`)}
      orderRepository={runtime.orderCommandRepository}
      reconcileOrder={runtime.reconcileOrder}
      state={state}
      store={runtime.services.jotaiStore}
    />
  );
}
