import { message as localizedMessage, useI18n } from "../../../shared/i18n";
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
  const { text } = useI18n();
  const action = getOwnerOrderAction(order.status, text);
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
      setError(localizedMessage("orders.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Button loading={submitting} onClick={() => void run()}>
        {text(action.label)}
      </Button>
      {error ? <p role="alert">{text(error)}</p> : null}
    </div>
  );
}
