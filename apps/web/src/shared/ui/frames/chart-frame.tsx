import { useId } from "react";
import type { ReactNode } from "react";

import { EmptyState } from "../feedback/empty-state";
import { ErrorState } from "../feedback/error-state";
import { Skeleton } from "../feedback/skeleton";

export type ChartFrameProps = {
  title: string;
  description?: string;
  summary: string;
  state?: "ready" | "loading" | "empty" | "error";
  loadingSlot?: ReactNode;
  emptySlot?: ReactNode;
  errorSlot?: ReactNode;
  children: ReactNode;
};

export function ChartFrame({
  title,
  description,
  summary,
  state = "ready",
  loadingSlot,
  emptySlot,
  errorSlot,
  children,
}: ChartFrameProps) {
  const titleId = useId();
  let content = children;
  if (state === "loading") content = loadingSlot ?? <Skeleton />;
  if (state === "empty") content = emptySlot ?? <EmptyState title="No chart data yet" />;
  if (state === "error") content = errorSlot ?? <ErrorState title="We couldn’t load this chart" />;

  return (
    <figure
      aria-labelledby={titleId}
      className="grid gap-3 rounded-card border border-solid border-border bg-surface p-6 font-sans text-charcoal [&_h2]:m-0 [&_h2]:text-section [&_h2]:leading-heading [&_p]:m-0 [&_p]:text-muted"
    >
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
      <figcaption className="text-charcoal!">{summary}</figcaption>
      <div className="min-h-control-lg">{content}</div>
    </figure>
  );
}
