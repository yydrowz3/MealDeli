import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import type { ReactNode } from "react";

import { Button, Card, DateTime, Money } from "../../../shared/ui";

import { ORDER_STATUS_DESCRIPTIONS } from "../model/status-machine";
import type { Order } from "../model/types";
import { OrderStatusBadge } from "./order-status-badge";

export type OrderCardProps = Readonly<{
  order: Order;
  action?: ReactNode;
  onView?: (order: Order) => void;
  viewLabel?: string;
}>;

function shortOrderId(id: string): string {
  return id.slice(0, 8);
}

export function OrderCard({
  order,
  action,
  onView,
  viewLabel = localizedMessage("common.viewOrder"),
}: OrderCardProps) {
  const { t, text, formatNumber } = useI18n();
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <Card className="grid gap-4 [&_h2]:m-0 [&_p]:m-0 [&_dl]:m-0">
      <div className="flex [align-items:start] justify-between gap-3">
        <div>
          <h2>{text(order.restaurant?.name ?? t("common.restaurantUnavailable"))}</h2>
          <p>
            {t("common.orderNumber")}
            {text(shortOrderId(order.id))}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <p>{text(ORDER_STATUS_DESCRIPTIONS[order.status])}</p>
      <dl className="grid grid-cols-[repeat(3,1fr)] gap-3 [&>div]:grid [&>div]:gap-1 [&_dt]:text-muted [&_dt]:text-[length:var(--font-size-small)] [&_dd]:m-0">
        <div>
          <dt>{t("orders.placed")}</dt>
          <dd>
            <DateTime value={order.createdAt} />
          </dd>
        </div>
        <div>
          <dt>{t("common.items")}</dt>
          <dd>{formatNumber(itemCount)}</dd>
        </div>
        <div>
          <dt>{t("common.total")}</dt>
          <dd>
            <Money minor={order.totalMinor} />
          </dd>
        </div>
      </dl>
      {action ??
        (onView ? (
          <Button onClick={() => onView(order)} variant="secondary">
            {text(viewLabel)}
          </Button>
        ) : null)}
    </Card>
  );
}
