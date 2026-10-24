import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { DeliveryPage } from "../modules/courier";
import { sessionUserAtom } from "../modules/identity";

export const Route = createFileRoute("/deliveries/$orderId")({ component: DeliveryRoute });

function DeliveryRoute() {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  const { orderId } = Route.useParams();
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["COURIER"] }}
    >
      <DeliveryPage
        courierId={user?.id ?? ""}
        onAssignmentLost={() => window.location.assign("/dashboard")}
        onBackDashboard={() => window.location.assign("/dashboard")}
        orderId={orderId}
        repository={runtime.courierRepository}
        subscriptions={runtime.orderSubscriptions}
      />
    </RequireAccess>
  );
}
