import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        "rounded-card border border-border bg-surface p-4 text-charcoal md:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
