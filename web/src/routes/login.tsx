import { createFileRoute } from "@tanstack/react-router";

import { getMealDeliRuntime } from "../app";
import { LoginPage } from "../modules/identity";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { returnTo } = Route.useSearch();
  const runtime = getMealDeliRuntime();
  return (
    <LoginPage
      navigate={(to) => window.location.assign(to)}
      repository={runtime.identityRepository}
      returnTo={returnTo}
      store={runtime.services.jotaiStore}
    />
  );
}
