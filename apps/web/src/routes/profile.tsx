import { createFileRoute } from "@tanstack/react-router";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { ProfilePage } from "../modules/identity";

export const Route = createFileRoute("/profile")({ component: ProfileRoute });

function ProfileRoute() {
  const runtime = getMealDeliRuntime();
  return (
    <RequireAccess route={{ requiresAuth: true, requiresVerification: true }}>
      <ProfilePage
        navigate={(to) => window.location.assign(to)}
        repository={runtime.identityRepository}
        store={runtime.services.jotaiStore}
        uploader={runtime.mediaUploader}
      />
    </RequireAccess>
  );
}
