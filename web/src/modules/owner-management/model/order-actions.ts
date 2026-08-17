import type { OrderStatus } from "../../orders";

export type OwnerOrderActionPolicy = Readonly<{
  label: string;
  targetStatus: "COOKING" | "WAITING";
}> | null;

export function getOwnerOrderAction(status: OrderStatus): OwnerOrderActionPolicy {
  if (status === "PENDING") return { label: "Start preparing", targetStatus: "COOKING" };
  if (status === "COOKING") {
    return { label: "Mark ready for pickup", targetStatus: "WAITING" };
  }
  return null;
}
