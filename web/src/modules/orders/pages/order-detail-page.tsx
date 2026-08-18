import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import {
  Button,
  ConnectionBanner,
  DateTime,
  EmptyState,
  ErrorState,
  Money,
  Skeleton,
} from "../../../shared/ui";

import { OrderStatusBadge } from "../components/order-status-badge";
import { OrderTimeline } from "../components/order-timeline";
import { ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from "../model/status-machine";
import type { Order, OrderRole } from "../model/types";
import type { OrderConnectionState } from "../api/subscription-adapter";

export type OrderDetailPageState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "error"; message?: string }>
  | Readonly<{ kind: "not-found" }>
  | Readonly<{ kind: "ready"; order: Order }>;

export type OrderDetailPageProps = Readonly<{
  role: OrderRole;
  state: OrderDetailPageState;
  connectionState?: OrderConnectionState;
  actionSlot?: ReactNode | ((order: Order) => ReactNode);
  onRetry?: () => void;
  onBack?: () => void;
}>;

export function OrderDetailPage({
  role,
  state,
  connectionState = "connected",
  actionSlot,
  onRetry,
  onBack,
}: OrderDetailPageProps) {
  if (state.kind === "loading") {
    return <main aria-label="Loading order" className="order-detail"><Skeleton /><Skeleton /><Skeleton /></main>;
  }
  if (state.kind === "error") {
    return (
      <main className="order-detail">
        <ErrorState
          action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
          description={state.message}
          title="We couldn’t load this order."
        />
      </main>
    );
  }
  if (state.kind === "not-found") {
    return (
      <main className="order-detail">
        <EmptyState
          action={
            onBack
              ? {
                  icon: <ArrowLeftIcon aria-hidden="true" size={18} />,
                  label: "Back to orders",
                  onClick: onBack,
                }
              : undefined
          }
          description="This order doesn’t exist or isn’t available to your account."
          title="Order not found"
        />
      </main>
    );
  }

  const order = state.order;
  const renderedAction = typeof actionSlot === "function" ? actionSlot(order) : actionSlot;
  return (
    <main className="order-detail">
      {connectionState === "reconnecting" ? <ConnectionBanner /> : null}
      <Button className="order-detail-back-button" onClick={onBack} variant="tertiary">
        <ArrowLeftIcon aria-hidden="true" size={18} />
        Back to orders
      </Button>
      <header className="order-detail__header">
        <div>
          <p>Order #{order.id.slice(0, 8)}</p>
          <h1>{ORDER_STATUS_LABELS[order.status]}</h1>
          <p>{ORDER_STATUS_DESCRIPTIONS[order.status]}</p>
          <DateTime value={order.createdAt} />
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <section aria-labelledby="restaurant-summary-heading" className="order-detail__section">
        <h2 id="restaurant-summary-heading">{order.restaurant?.name ?? "Restaurant unavailable"}</h2>
        {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      </section>

      <section aria-labelledby="progress-heading" className="order-detail__section">
        <h2 id="progress-heading">Order progress</h2>
        <OrderTimeline status={order.status} />
      </section>

      <section aria-labelledby="items-heading" className="order-detail__section">
        <h2 id="items-heading">Items</h2>
        <ul className="order-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <div><strong>{item.quantity} × {item.dishName}</strong><Money minor={item.lineTotalMinor} /></div>
              {item.selectedOptions.map((option) => (
                <p key={option.optionId}>{option.name}: {option.choices.map((choice) => choice.name).join(", ")}</p>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="summary-heading" className="order-detail__section order-summary">
        <h2 id="summary-heading">Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd><Money minor={order.totalMinor} /></dd></div>
          <div><dt>Delivery</dt><dd><Money minor={0} /></dd></div>
          <div><dt>Total</dt><dd><Money minor={order.totalMinor} /></dd></div>
        </dl>
        {role === "CUSTOMER" ? <p>Payment completed in demo mode.</p> : null}
      </section>

      {renderedAction ? <div className="order-detail__action">{renderedAction}</div> : null}
    </main>
  );
}
