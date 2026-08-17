import { createFileRoute } from "@tanstack/react-router";

import { getMealDeliRuntime } from "../app";
import { SignupPage, parseSignupRole } from "../modules/identity";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search.role === "string" ? search.role : undefined,
  }),
  component: SignupRoute,
});

function SignupRoute() {
  const runtime = getMealDeliRuntime();
  const { role } = Route.useSearch();
  return (
    <SignupPage
      navigate={(to) => window.location.assign(to)}
      repository={runtime.identityRepository}
      role={parseSignupRole(role)}
    />
  );
}
