import { useState } from "react";

import type { Order, OrderRepository } from "../../orders";
import { Button } from "../../../shared/ui";
import { getOwnerOrderAction } from "../model/order-actions";

export type OwnerOrdersActionProps = Readonly<{
  order: Order;
  repository: Pick<OrderRepository, "get" | "updateStatus">;
  onOrder: (order: Order) => void;
}>;

export function OwnerOrdersAction({ order, repository, onOrder }: OwnerOrdersActionProps) {
  const action = getOwnerOrderAction(order.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!action) return null;

  const run = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await repository.updateStatus(order.id, action.targetStatus);
      const result = await repository.get(order.id);
      if (result.kind === "found") onOrder(result.order);
    } catch {
      const result = await repository.get(order.id);
      if (result.kind === "found") onOrder(result.order);
      setError("We couldn’t update this order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="owner-order-action">
      <Button loading={submitting} onClick={() => void run()}>
        {action.label}
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
