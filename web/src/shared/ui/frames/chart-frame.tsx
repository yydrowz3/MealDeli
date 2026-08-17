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
    <figure aria-labelledby={titleId} className="ui-frame">
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
      <figcaption className="ui-frame__summary">{summary}</figcaption>
      <div className="ui-frame__content">{content}</div>
    </figure>
  );
}
