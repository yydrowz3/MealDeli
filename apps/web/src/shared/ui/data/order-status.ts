import { message as localizedMessage, resolveMessage } from "../../i18n";
import { Bicycle, CheckCircle, CookingPot, Package, Receipt } from "@phosphor-icons/react";
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
  PENDING: { label: localizedMessage("orders.pending"), tone: "neutral", Icon: Receipt },
  COOKING: { label: localizedMessage("orders.cooking"), tone: "jade", Icon: CookingPot },
  WAITING: { label: localizedMessage("orders.waiting"), tone: "warning", Icon: Package },
  PICKED: { label: localizedMessage("orders.picked"), tone: "info", Icon: Bicycle },
  DELIVERED: { label: localizedMessage("orders.delivered"), tone: "success", Icon: CheckCircle },
};

export function getOrderStatusPresentation(
  status: OrderStatus,
  resolve: (value: string) => string = resolveMessage,
): StatusPresentation {
  return { ...presentations[status], label: resolve(presentations[status].label) };
}
