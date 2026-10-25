import { message as localizedMessage, useI18n } from "../../i18n";
import { useId } from "react";
import type { ReactNode } from "react";

import { Button } from "../primitives/button";
import { Skeleton } from "../feedback/skeleton";

export type MapFrameProps = {
  title: string;
  description?: string;
  state?: "ready" | "loading" | "fallback";
  loadingSlot?: ReactNode;
  fallbackSlot?: ReactNode;
  attribution?: ReactNode;
  skipLabel?: string;
  onSkipMap: () => void;
  children: ReactNode;
};

export function MapFrame({
  title,
  description,
  state = "ready",
  loadingSlot,
  fallbackSlot,
  attribution,
  skipLabel = localizedMessage("ui.skipMap"),
  onSkipMap,
  children,
}: MapFrameProps) {
  const { t, text } = useI18n();
  const titleId = useId();
  let content = children;
  if (state === "loading") content = loadingSlot ?? <Skeleton />;
  if (state === "fallback") content = fallbackSlot ?? <p>{t("ui.mapUnavailable")}</p>;

  return (
    <section
      aria-labelledby={titleId}
      className="grid min-w-0 gap-3 rounded-card border border-border bg-surface p-4 font-sans text-charcoal md:p-6 [&_p]:text-muted"
    >
      <h2 className="text-section leading-heading" id={titleId}>
        {text(title)}
      </h2>
      {description ? <p>{text(description)}</p> : null}
      <Button className="justify-self-start" onClick={onSkipMap} variant="tertiary">
        {text(skipLabel)}
      </Button>
      <div className="min-h-control-lg">{text(content)}</div>
      {attribution ? <footer className="text-small text-muted">{text(attribution)}</footer> : null}
    </section>
  );
}
