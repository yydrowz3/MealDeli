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
    <Card className="grid gap-4">
      <p className="text-jade-text text-[0.82rem] font-bold tracking-[0.08em] uppercase">
        Order ready for pickup
      </p>
      <h3 ref={headingRef} tabIndex={-1}>
        {order.restaurant?.name ?? "Restaurant unavailable"}
      </h3>
      {order.restaurant ? <p>{order.restaurant.address}</p> : null}
      <dl className="grid grid-cols-2 gap-3 m-0">
        <div className="grid gap-1">
          <dt className="text-muted text-[0.875rem]">Items</dt>
          <dd className="m-0 font-[650]">
            {order.items.reduce((total, item) => total + item.quantity, 0)}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted text-[0.875rem]">Order total</dt>
          <dd className="m-0 font-[650]">
            <Money minor={order.totalMinor} />
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted text-[0.875rem]">Created</dt>
          <dd className="m-0 font-[650]">
            <DateTime value={order.createdAt} />
          </dd>
        </div>
      </dl>
      <Button disabled={disabled || accepting} loading={accepting} onClick={() => onAccept(order)}>
        Accept order
      </Button>
      {disabledReason ? <p className="text-muted text-[0.875rem]">{disabledReason}</p> : null}
    </Card>
  );
}
