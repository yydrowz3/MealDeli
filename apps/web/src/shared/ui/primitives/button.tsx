import { useI18n } from "../../i18n";
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
    "border-transparent bg-jade text-on-primary enabled:hover:bg-jade-dark enabled:hover:text-on-primary-hover",
  secondary: "border-border bg-surface text-charcoal enabled:hover:bg-neutral-soft",
  tertiary: "border-transparent bg-transparent text-action enabled:hover:bg-neutral-soft",
  danger: "border-transparent bg-danger text-on-danger enabled:hover:bg-danger-hover",
};

const sizeClasses = {
  sm: "min-h-control-sm text-small",
  md: "min-h-control-md text-body",
  lg: "min-h-control-lg text-body",
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
  const { text } = useI18n();
  if (iconOnly && !props["aria-label"]) {
    throw new Error("Icon-only buttons require an aria-label.");
  }

  const classes = [
    "relative inline-flex items-center justify-center rounded-control border font-sans font-semibold leading-none cursor-pointer transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
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
      <span
        className={["inline-flex items-center gap-2", loading ? "invisible" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {text(children)}
      </span>
      {loading ? (
        <CircleNotch aria-hidden="true" className="absolute animate-ui-spin" size={20} />
      ) : null}
    </button>
  );
}
