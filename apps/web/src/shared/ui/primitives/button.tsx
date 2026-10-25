import { CircleNotch } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconOnly?: boolean;
};

const variantClasses = {
  primary:
    "border-transparent bg-jade text-on-primary [&:hover:not(:disabled)]:bg-jade-dark [&:hover:not(:disabled)]:text-on-primary-hover",
  secondary: "border-border bg-surface text-charcoal [&:hover:not(:disabled)]:bg-neutral-soft",
  tertiary:
    "border-transparent bg-transparent text-action [&:hover:not(:disabled)]:bg-neutral-soft",
  danger: "border-transparent bg-danger text-on-danger [&:hover:not(:disabled)]:bg-danger-hover",
};

const sizeClasses = {
  sm: "min-h-control-sm text-small leading-none",
  md: "min-h-control-md text-body leading-none",
  lg: "min-h-control-lg text-body leading-none",
};
const paddingClasses = { sm: "px-3", md: "px-4", lg: "px-6" };

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
    "relative inline-flex items-center justify-center gap-2 rounded-control border border-solid font-sans font-[650] cursor-pointer transition-[background-color,border-color,color] duration-150 ease-[ease] focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-[0.62] py-0",
    variantClasses[variant],
    sizeClasses[size],
    iconOnly ? "px-3" : paddingClasses[size],
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
      <span className={loading ? "invisible" : undefined}>{children}</span>
      {loading ? (
        <CircleNotch aria-hidden="true" className="absolute animate-ui-spin" size={20} />
      ) : null}
    </button>
  );
}
