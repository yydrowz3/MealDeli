import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { OwnerCreateRestaurantPage } from "../modules/owner-management";

export const Route = createFileRoute("/restaurants/new")({ component: NewRestaurantRoute });

function NewRestaurantRoute() {
  const runtime = getMealDeliRuntime();
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["OWNER"] }}
    >
      <OwnerCreateRestaurantPage
        catalogRepository={runtime.catalogRepository}
        navigate={(to) => window.location.assign(to)}
        repository={runtime.ownerRepository}
        uploader={runtime.mediaUploader}
      />
    </RequireAccess>
  );
}
