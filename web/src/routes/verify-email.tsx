import { createFileRoute } from "@tanstack/react-router";

import { getMealDeliRuntime } from "../app";
import { VerifyEmailPage } from "../modules/identity";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const runtime = getMealDeliRuntime();
  const { token } = Route.useSearch();
  return (
    <VerifyEmailPage
      navigate={(to) => window.location.assign(to)}
      repository={runtime.identityRepository}
      store={runtime.services.jotaiStore}
      token={token}
    />
  );
}
