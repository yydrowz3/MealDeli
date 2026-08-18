import type { ReactNode } from "react";

import { Button } from "../primitives/button";

export type AsyncStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  icon?: ReactNode;
};

export type AsyncStateViewProps = AsyncStateProps & {
  kind: "empty" | "error";
};

export function AsyncStateView({ title, description, action, icon, kind }: AsyncStateViewProps) {
  return (
    <section aria-labelledby={`${kind}-state-title`} className="ui-async-state" data-state={kind}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <h2 id={`${kind}-state-title`}>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? (
        <Button onClick={action.onClick} variant={kind === "error" ? "secondary" : "primary"}>
          {action.icon}
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}
