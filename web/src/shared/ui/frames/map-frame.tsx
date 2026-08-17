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
    <section aria-labelledby={titleId} className="ui-frame">
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
      <Button className="ui-map-skip" onClick={onSkipMap} variant="tertiary">
        {skipLabel}
      </Button>
      <div className="ui-frame__content">{content}</div>
      {attribution ? <footer className="ui-frame__attribution">{attribution}</footer> : null}
    </section>
  );
}
