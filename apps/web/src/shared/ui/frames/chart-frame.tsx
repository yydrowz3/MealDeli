import { useI18n } from "../../i18n";
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
  const { t, text } = useI18n();
  const titleId = useId();
  let content = children;
  if (state === "loading") content = loadingSlot ?? <Skeleton />;
  if (state === "empty") content = emptySlot ?? <EmptyState title={t("ui.noChartData")} />;
  if (state === "error") content = errorSlot ?? <ErrorState title={t("ui.chartError")} />;

  return (
    <figure
      aria-labelledby={titleId}
      className="grid min-w-0 gap-3 rounded-card border border-border bg-surface p-4 font-sans text-charcoal md:p-6 [&_p]:text-muted"
    >
      <h2 className="text-section leading-heading" id={titleId}>
        {text(title)}
      </h2>
      {description ? <p>{text(description)}</p> : null}
      <figcaption>{text(summary)}</figcaption>
      <div className="min-h-control-lg">{text(content)}</div>
    </figure>
  );
}
