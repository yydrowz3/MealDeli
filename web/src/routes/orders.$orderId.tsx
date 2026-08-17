import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess } from "../app";
import { OrderDetailRouteContent } from "../app/composition/order-route-content";

export const Route = createFileRoute("/orders/$orderId")({ component: OrderDetailRoute });

function OrderDetailRoute() {
  const { orderId } = Route.useParams();
  return (
    <RequireAccess route={{ requiresAuth: true, requiresVerification: true }}>
      <OrderDetailRouteContent orderId={orderId} />
    </RequireAccess>
  );
}
