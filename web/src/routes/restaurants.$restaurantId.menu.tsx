import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { OwnerMenuPage } from "../modules/owner-management";

export const Route = createFileRoute("/restaurants/$restaurantId/menu")({
  component: OwnerMenuRoute,
});

function OwnerMenuRoute() {
  const runtime = getMealDeliRuntime();
  const { restaurantId } = Route.useParams();
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["OWNER"] }}
    >
      <OwnerMenuPage
        repository={runtime.ownerRepository}
        restaurantId={restaurantId}
        uploader={runtime.mediaUploader}
      />
    </RequireAccess>
  );
}
