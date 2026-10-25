import { message as localizedMessage, resolveMessage } from "../../../shared/i18n";
import type { OrderStatus } from "../../orders";

export type OwnerOrderActionPolicy = Readonly<{
  label: string;
  targetStatus: "COOKING" | "WAITING";
}> | null;

export function getOwnerOrderAction(
  status: OrderStatus,
  resolve: (value: string) => string = resolveMessage,
): OwnerOrderActionPolicy {
  if (status === "PENDING")
    return { label: resolve(localizedMessage("owner.startPreparing")), targetStatus: "COOKING" };
  if (status === "COOKING") {
    return { label: resolve(localizedMessage("owner.markReady")), targetStatus: "WAITING" };
  }
  return null;
}
