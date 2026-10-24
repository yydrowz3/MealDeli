import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { PromotionPage } from "../modules/owner-insights";

export const Route = createFileRoute("/restaurants/$restaurantId/promotion")({
  component: PromotionRoute,
});

function PromotionRoute() {
  const runtime = getMealDeliRuntime();
  const { restaurantId } = Route.useParams();
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["OWNER"] }}
    >
      <PromotionPage repository={runtime.promotionRepository} restaurantId={restaurantId} />
    </RequireAccess>
  );
}
