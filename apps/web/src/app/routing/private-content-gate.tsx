import { useI18n } from "../../shared/i18n";
import type { ReactNode } from "react";
import { Skeleton } from "../../shared/ui";
import type { AccessDecision } from "./access-policy";

export function PrivateContentGate(props: {
  decision: AccessDecision;
  children: ReactNode;
  onRedirect: (to: string) => void;
}) {
  const { t } = useI18n();
  if (props.decision.kind === "checking") {
    return (
      <main
        aria-label={t("app.checkingSession")}
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
          <h1 className="m-0 text-[length:var(--font-size-page)]">{t("app.accessDenied")}</h1>
          <button
            className="cursor-pointer [justify-self:start] border-0 border-none bg-transparent text-action underline"
            onClick={() => props.onRedirect(decision.to)}
            type="button"
          >
            {t("common.continue")}
          </button>
        </main>
      );
    }
    props.onRedirect(decision.to);
    return null;
  }
  return props.children;
}
