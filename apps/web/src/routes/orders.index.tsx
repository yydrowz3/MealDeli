import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess } from "../app";
import { OrdersRouteContent } from "../app/composition/order-route-content";

export const Route = createFileRoute("/orders/")({ component: OrdersRoute });

function OrdersRoute() {
  return (
    <RequireAccess route={{ requiresAuth: true, requiresVerification: true }}>
      <OrdersRouteContent />
    </RequireAccess>
  );
}
