import type { ReactNode } from "react";
import { Skeleton } from "../../shared/ui";
import type { AccessDecision } from "./access-policy";

export function PrivateContentGate(props: {
  decision: AccessDecision;
  children: ReactNode;
  onRedirect: (to: string) => void;
}) {
  if (props.decision.kind === "checking") {
    return (
      <main aria-label="Checking your session" className="app-session-skeleton">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }
  if (props.decision.kind === "redirect") {
    const decision = props.decision;
    if (decision.reason === "role") {
      return (
        <main className="app-state" role="alert">
          <h1>You don’t have access to this page.</h1>
          <button
            className="app-text-link"
            onClick={() => props.onRedirect(decision.to)}
            type="button"
          >
            Continue
          </button>
        </main>
      );
    }
    props.onRedirect(decision.to);
    return null;
  }
  return props.children;
}
