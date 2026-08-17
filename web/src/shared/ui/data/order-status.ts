import {
  Bicycle,
  CheckCircle,
  CookingPot,
  Package,
  Receipt,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";

import type { BadgeTone } from "../feedback/badge";

export type OrderStatus = "PENDING" | "COOKING" | "WAITING" | "PICKED" | "DELIVERED";

export type StatusPresentation = {
  label: string;
  tone: BadgeTone;
  Icon: ComponentType<IconProps>;
};

const presentations: Record<OrderStatus, StatusPresentation> = {
  PENDING: { label: "Order placed", tone: "neutral", Icon: Receipt },
  COOKING: { label: "Preparing your order", tone: "jade", Icon: CookingPot },
  WAITING: { label: "Ready for pickup", tone: "warning", Icon: Package },
  PICKED: { label: "On the way", tone: "info", Icon: Bicycle },
  DELIVERED: { label: "Delivered", tone: "success", Icon: CheckCircle },
};

export function getOrderStatusPresentation(status: OrderStatus): StatusPresentation {
  return presentations[status];
}
