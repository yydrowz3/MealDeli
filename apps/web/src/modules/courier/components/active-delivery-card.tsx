import { Button, Card, DateTime, Money, StatusBadge } from "../../../shared/ui";
import type { Order } from "../../orders";

export type ActiveDeliveryCardProps = Readonly<{
  order: Order;
  onContinue: (order: Order) => void;
}>;

export function ActiveDeliveryCard({ order, onContinue }: ActiveDeliveryCardProps) {
  return (
    <Card className="grid gap-4 mt-6 mx-0 mb-10">
      <div>
        <p className="text-[#087f5b] text-[0.82rem] font-bold tracking-[0.08em] uppercase">
          Active delivery
        </p>
        <h2>{order.restaurant?.name ?? "Restaurant unavailable"}</h2>
        {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      </div>
      <StatusBadge status="PICKED" />
      <dl className="grid grid-cols-2 gap-3 m-0">
        <div className="grid gap-1">
          <dt className="text-[#5d6762] text-[0.875rem]">Order total</dt>
          <dd className="m-0 font-[650]">
            <Money minor={order.totalMinor} />
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-[#5d6762] text-[0.875rem]">Accepted</dt>
          <dd className="m-0 font-[650]">
            <DateTime value={order.updatedAt} />
          </dd>
        </div>
      </dl>
      <Button onClick={() => onContinue(order)}>Continue delivery</Button>
    </Card>
  );
}
