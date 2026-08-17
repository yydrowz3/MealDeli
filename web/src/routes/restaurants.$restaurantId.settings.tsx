import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { OwnerRestaurantSettingsPage } from "../modules/owner-management";

export const Route = createFileRoute("/restaurants/$restaurantId/settings")({
  component: OwnerSettingsRoute,
});

function OwnerSettingsRoute() {
  const runtime = getMealDeliRuntime();
  const { restaurantId } = Route.useParams();
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["OWNER"] }}
    >
      <OwnerRestaurantSettingsPage
        navigate={(to) => window.location.assign(to)}
        repository={runtime.ownerRepository}
        restaurantId={restaurantId}
        uploader={runtime.mediaUploader}
      />
    </RequireAccess>
  );
}
