import { CircleNotch } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconOnly?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconOnly = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  if (iconOnly && !props["aria-label"]) {
    throw new Error("Icon-only buttons require an aria-label.");
  }

  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    iconOnly ? "ui-button--icon" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      <span className={loading ? "ui-button__content--loading" : undefined}>{children}</span>
      {loading ? <CircleNotch aria-hidden="true" className="ui-button__spinner" size={20} /> : null}
    </button>
  );
}
