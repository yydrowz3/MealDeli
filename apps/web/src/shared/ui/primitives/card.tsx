import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        "rounded-card border border-solid border-border bg-surface p-6 text-charcoal",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
