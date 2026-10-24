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
    return (
      <main
        aria-label="Loading order"
        className="mx-auto grid w-full max-w-240 gap-6 p-6 font-sans text-charcoal"
      >
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }
  if (state.kind === "error") {
    return (
      <main className="mx-auto grid w-full max-w-240 gap-6 p-6 font-sans text-charcoal">
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
      <main className="mx-auto grid w-full max-w-240 gap-6 p-6 font-sans text-charcoal">
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
    <main className="mx-auto grid w-full max-w-240 gap-6 p-6 font-sans text-charcoal">
      {connectionState === "reconnecting" ? <ConnectionBanner /> : null}
      <Button
        className="[&>span]:inline-flex [&>span]:flex-row [&>span]:items-center [&>span]:gap-2"
        onClick={onBack}
        variant="tertiary"
      >
        <ArrowLeftIcon aria-hidden="true" size={18} />
        Back to orders
      </Button>
      <header className="flex [align-items:start] justify-between gap-4">
        <div>
          <p className="mt-0 mb-2">Order #{order.id.slice(0, 8)}</p>
          <h1 className="m-0">{ORDER_STATUS_LABELS[order.status]}</h1>
          <p className="mt-0 mb-2">{ORDER_STATUS_DESCRIPTIONS[order.status]}</p>
          <DateTime value={order.createdAt} />
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <section
        aria-labelledby="restaurant-summary-heading"
        className="rounded-card border border-solid border-border bg-surface p-6"
      >
        <h2 className="mt-0" id="restaurant-summary-heading">
          {order.restaurant?.name ?? "Restaurant unavailable"}
        </h2>
        {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      </section>

      <section
        aria-labelledby="progress-heading"
        className="rounded-card border border-solid border-border bg-surface p-6"
      >
        <h2 className="mt-0" id="progress-heading">
          Order progress
        </h2>
        <OrderTimeline status={order.status} />
      </section>

      <section
        aria-labelledby="items-heading"
        className="rounded-card border border-solid border-border bg-surface p-6"
      >
        <h2 className="mt-0" id="items-heading">
          Items
        </h2>
        <ul className="m-0 grid list-none gap-4 p-0">
          {order.items.map((item) => (
            <li
              className="[&+li]:border-t [&+li]:border-solid [&+li]:border-t-border [&+li]:pt-4"
              key={item.id}
            >
              <div className="flex justify-between gap-3">
                <strong>
                  {item.quantity} × {item.dishName}
                </strong>
                <Money minor={item.lineTotalMinor} />
              </div>
              {item.selectedOptions.map((option) => (
                <p className="mb-0 text-muted" key={option.optionId}>
                  {option.name}: {option.choices.map((choice) => choice.name).join(", ")}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="summary-heading"
        className="rounded-card border border-solid border-border bg-surface p-6"
      >
        <h2 className="mt-0" id="summary-heading">
          Order summary
        </h2>
        <dl className="[&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dd]:m-0">
          <div>
            <dt>Subtotal</dt>
            <dd>
              <Money minor={order.totalMinor} />
            </dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>
              <Money minor={0} />
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>
              <Money minor={order.totalMinor} />
            </dd>
          </div>
        </dl>
        {role === "CUSTOMER" ? <p>Payment completed in demo mode.</p> : null}
      </section>

      {renderedAction ? <div>{renderedAction}</div> : null}
    </main>
  );
}
