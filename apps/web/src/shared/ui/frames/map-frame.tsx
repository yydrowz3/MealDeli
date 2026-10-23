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
  skipLabel = "Skip map",
  onSkipMap,
  children,
}: MapFrameProps) {
  const titleId = useId();
  let content = children;
  if (state === "loading") content = loadingSlot ?? <Skeleton />;
  if (state === "fallback") content = fallbackSlot ?? <p>The map is unavailable.</p>;

  return (
    <section
      aria-labelledby={titleId}
      className="grid gap-3 rounded-card border border-solid border-border bg-surface p-6 font-sans text-charcoal [&_h2]:m-0 [&_h2]:text-section [&_h2]:leading-heading [&_p]:m-0 [&_p]:text-muted"
    >
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
      <Button className="[justify-self:start]" onClick={onSkipMap} variant="tertiary">
        {skipLabel}
      </Button>
      <div className="min-h-control-lg">{content}</div>
      {attribution ? (
        <footer className="text-[length:var(--font-size-small)] text-muted">{attribution}</footer>
      ) : null}
    </section>
  );
}
