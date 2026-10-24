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
      <main
        aria-label="Checking your session"
        className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6"
      >
        <Skeleton className="min-h-12! w-[55%]" />
        <Skeleton className="min-h-28!" />
        <Skeleton className="min-h-48!" />
      </main>
    );
  }
  if (props.decision.kind === "redirect") {
    const decision = props.decision;
    if (decision.reason === "role") {
      return (
        <main className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6" role="alert">
          <h1 className="m-0 text-[length:var(--font-size-page)]">
            You don’t have access to this page.
          </h1>
          <button
            className="cursor-pointer [justify-self:start] border-0 border-none bg-transparent text-jade-dark underline"
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
