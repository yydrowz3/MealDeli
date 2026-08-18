import { Button, Card, DateTime, Money, StatusBadge } from "../../../shared/ui";
import type { Order } from "../../orders";

export type ActiveDeliveryCardProps = Readonly<{
  order: Order;
  onContinue: (order: Order) => void;
}>;

export function ActiveDeliveryCard({ order, onContinue }: ActiveDeliveryCardProps) {
  return (
    <Card className="courier-active-card">
      <div>
        <p className="courier-eyebrow">Active delivery</p>
        <h2>{order.restaurant?.name ?? "Restaurant unavailable"}</h2>
        {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      </div>
      <StatusBadge status="PICKED" />
      <dl className="courier-order-card__facts">
        <div>
          <dt>Order total</dt>
          <dd>
            <Money minor={order.totalMinor} />
          </dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>
            <DateTime value={order.updatedAt} />
          </dd>
        </div>
      </dl>
      <Button onClick={() => onContinue(order)}>Continue delivery</Button>
    </Card>
  );
}
