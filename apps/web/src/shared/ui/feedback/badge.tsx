import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "neutral" | "jade" | "success" | "warning" | "info" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-neutral-soft text-charcoal",
  jade: "bg-jade-soft text-jade-text",
  success: "bg-jade-soft text-jade-text",
  warning: "bg-warning-soft text-warning-text",
  info: "bg-info-soft text-info-dark",
  danger: "bg-danger-soft text-danger-dark",
};

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={[
        "inline-flex items-center gap-1 rounded-control px-2 py-1 font-sans text-small font-[650]",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tone={tone}
    >
      {icon}
      {children}
    </span>
  );
}
