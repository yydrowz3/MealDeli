import { errorMessage, useI18n } from "../../../shared/i18n";
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
  const { t, text, formatNumber } = useI18n();
  if (state.kind === "loading") {
    return (
      <main
        aria-label={t("orders.loadingOrder")}
        className="mx-auto grid w-full max-w-240 gap-6 p-4 text-charcoal md:p-6"
      >
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }
  if (state.kind === "error") {
    return (
      <main className="mx-auto grid w-full max-w-240 gap-6 p-4 text-charcoal md:p-6">
        <ErrorState
          action={onRetry ? { label: t("common.tryAgain"), onClick: onRetry } : undefined}
          description={text(errorMessage(state.message, "common.connectionRetry"))}
          title={t("orders.loadOrderFailed")}
        />
      </main>
    );
  }
  if (state.kind === "not-found") {
    return (
      <main className="mx-auto grid w-full max-w-240 gap-6 p-4 text-charcoal md:p-6">
        <EmptyState
          action={
            onBack
              ? {
                  icon: <ArrowLeftIcon aria-hidden="true" size={18} />,
                  label: t("orders.back"),
                  onClick: onBack,
                }
              : undefined
          }
          description={t("orders.unavailable")}
          title={t("courier.orderNotFound")}
        />
      </main>
    );
  }

  const order = state.order;
  const renderedAction = typeof actionSlot === "function" ? actionSlot(order) : actionSlot;
  return (
    <main className="mx-auto grid w-full max-w-240 gap-6 p-4 text-charcoal md:p-6">
      {connectionState === "reconnecting" ? <ConnectionBanner /> : null}
      <Button onClick={onBack} variant="tertiary">
        <ArrowLeftIcon aria-hidden="true" size={18} />
        {t("orders.back")}
      </Button>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2">
            {t("common.orderNumber")}
            {text(order.id.slice(0, 8))}
          </p>
          <h1>{text(ORDER_STATUS_LABELS[order.status])}</h1>
          <p className="mb-2">{text(ORDER_STATUS_DESCRIPTIONS[order.status])}</p>
          <DateTime value={order.createdAt} />
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <section
        aria-labelledby="restaurant-summary-heading"
        className="rounded-card border border-border bg-surface p-6"
      >
        <h2 id="restaurant-summary-heading">
          {text(order.restaurant?.name ?? t("common.restaurantUnavailable"))}
        </h2>
        {order.restaurant ? <p>{text(order.restaurant.address)}</p> : null}
      </section>

      <section
        aria-labelledby="progress-heading"
        className="rounded-card border border-border bg-surface p-6"
      >
        <h2 id="progress-heading">
          {t("orders.progress")}
        </h2>
        <OrderTimeline status={order.status} />
      </section>

      <section
        aria-labelledby="items-heading"
        className="rounded-card border border-border bg-surface p-6"
      >
        <h2 id="items-heading">
          {t("common.items")}
        </h2>
        <ul className="grid list-none gap-4 p-0">
          {order.items.map((item) => (
            <li
              className="[&+li]:border-t [&+li]:border-t-border [&+li]:pt-4"
              key={item.id}
            >
              <div className="flex justify-between gap-3">
                <strong>
                  {formatNumber(item.quantity)} × {text(item.dishName)}
                </strong>
                <Money minor={item.lineTotalMinor} />
              </div>
              {item.selectedOptions.map((option) => (
                <p className="mb-0 text-muted" key={option.optionId}>
                  {text(option.name)}: {option.choices.map((choice) => choice.name).join(", ")}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="summary-heading"
        className="rounded-card border border-border bg-surface p-6"
      >
        <h2 id="summary-heading">
          {t("common.orderSummary")}
        </h2>
        <dl className="[&>div]:flex [&>div]:justify-between [&>div]:gap-3">
          <div>
            <dt>{t("common.subtotal")}</dt>
            <dd>
              <Money minor={order.totalMinor} />
            </dd>
          </div>
          <div>
            <dt>{t("common.delivery")}</dt>
            <dd>
              <Money minor={0} />
            </dd>
          </div>
          <div>
            <dt>{t("common.total")}</dt>
            <dd>
              <Money minor={order.totalMinor} />
            </dd>
          </div>
        </dl>
        {role === "CUSTOMER" ? <p>{t("orders.demoPaid")}</p> : null}
      </section>

      {renderedAction ? <div>{text(renderedAction)}</div> : null}
    </main>
  );
}
