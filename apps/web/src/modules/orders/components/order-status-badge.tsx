import { StatusBadge } from "../../../shared/ui";

import type { OrderStatus } from "../model/types";

export type OrderStatusBadgeProps = Readonly<{ status: OrderStatus }>;

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <StatusBadge status={status} />;
}
