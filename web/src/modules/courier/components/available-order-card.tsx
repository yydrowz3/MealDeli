import { Button, Card, DateTime, Money } from "../../../shared/ui";
import type { AvailableOrder } from "../model/available-orders";

export type AvailableOrderCardProps = Readonly<{
  order: AvailableOrder;
  accepting?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  headingRef?: (element: HTMLHeadingElement | null) => void;
  onAccept: (order: AvailableOrder) => void;
}>;

export function AvailableOrderCard({
  order,
  accepting = false,
  disabled = false,
  disabledReason,
  headingRef,
  onAccept,
}: AvailableOrderCardProps) {
  return (
    <Card className="courier-order-card">
      <p className="courier-eyebrow">Order ready for pickup</p>
      <h3 ref={headingRef} tabIndex={-1}>
        {order.restaurant?.name ?? "Restaurant unavailable"}
      </h3>
      {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      <dl className="courier-order-card__facts">
        <div>
          <dt>Items</dt>
          <dd>{order.items.reduce((total, item) => total + item.quantity, 0)}</dd>
        </div>
        <div>
          <dt>Order total</dt>
          <dd><Money minor={order.totalMinor} /></dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd><DateTime value={order.createdAt} /></dd>
        </div>
      </dl>
      <Button
        disabled={disabled || accepting}
        loading={accepting}
        onClick={() => onAccept(order)}
      >
        Accept order
      </Button>
      {disabledReason ? <p className="courier-help">{disabledReason}</p> : null}
    </Card>
  );
}

