import { Badge } from "../feedback/badge";
import { getOrderStatusPresentation } from "./order-status";
import type { OrderStatus } from "./order-status";

export type StatusBadgeProps = {
  status: OrderStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, tone, Icon } = getOrderStatusPresentation(status);
  return (
    <Badge icon={<Icon aria-hidden="true" size={18} />} tone={tone}>
      {label}
    </Badge>
  );
}
