import { useAtomValue } from "jotai";
import type { ReactNode } from "react";

import { identityAtom } from "../../modules/identity";
import { accessPolicy } from "./access-policy";
import type { RouteMetadata } from "./access-policy";
import { PrivateContentGate } from "./private-content-gate";

export function RequireAccess({
  children,
  route,
}: Readonly<{ children: ReactNode; route: RouteMetadata }>) {
  const identity = useAtomValue(identityAtom);
  const decision = accessPolicy({
    sessionStatus:
      identity.status === "idle" || identity.status === "checking"
        ? "checking"
        : identity.status === "authenticated"
          ? "authenticated"
          : "guest",
    verifiedAt: identity.user?.verifiedAt ?? null,
    role: identity.user?.role ?? null,
    route,
    pathname: window.location.pathname,
    search: window.location.search,
  });
  return (
    <PrivateContentGate
      decision={decision}
      onRedirect={(to) => window.location.assign(to)}
    >
      {children}
    </PrivateContentGate>
  );
}
