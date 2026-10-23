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

export function OrderCard({ order, action, onView, viewLabel = "View order" }: OrderCardProps) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <Card className="orders-card">
      <div className="orders-card__header">
        <div>
          <h2>{order.restaurant?.name ?? "Restaurant unavailable"}</h2>
          <p>Order #{shortOrderId(order.id)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <p>{ORDER_STATUS_DESCRIPTIONS[order.status]}</p>
      <dl className="orders-card__facts">
        <div>
          <dt>Placed</dt>
          <dd>
            <DateTime value={order.createdAt} />
          </dd>
        </div>
        <div>
          <dt>Items</dt>
          <dd>{itemCount}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>
            <Money minor={order.totalMinor} />
          </dd>
        </div>
      </dl>
      {action ??
        (onView ? (
          <Button onClick={() => onView(order)} variant="secondary">
            {viewLabel}
          </Button>
        ) : null)}
    </Card>
  );
}
