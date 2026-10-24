import { createFileRoute } from "@tanstack/react-router";

import { CheckoutRouteContent } from "../app/composition/order-route-content";
import { RequireAccess } from "../app";

export const Route = createFileRoute("/checkout")({ component: CheckoutRoute });

function CheckoutRoute() {
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["CUSTOMER"] }}
    >
      <CheckoutRouteContent />
    </RequireAccess>
  );
}
