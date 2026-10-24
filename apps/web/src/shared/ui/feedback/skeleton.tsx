import type { HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={["min-h-4 animate-ui-pulse rounded-control bg-neutral-soft", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
