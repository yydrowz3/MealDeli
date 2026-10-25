import { Badge } from "../feedback/badge";
import { useI18n } from "../../i18n";
import { getOrderStatusPresentation } from "./order-status";
import type { OrderStatus } from "./order-status";

export type StatusBadgeProps = {
  status: OrderStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { text } = useI18n();
  const { label, tone, Icon } = getOrderStatusPresentation(status, text);
  return (
    <Badge icon={<Icon aria-hidden="true" size={18} />} tone={tone}>
      {label}
    </Badge>
  );
}
