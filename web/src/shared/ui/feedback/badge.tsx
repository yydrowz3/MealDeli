import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "neutral" | "jade" | "success" | "warning" | "info" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={["ui-badge", `ui-badge--${tone}`, className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      {icon}
      {children}
    </span>
  );
}
