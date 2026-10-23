import type { HTMLAttributes } from "react";

export type ConnectionBannerProps = HTMLAttributes<HTMLDivElement> & {
  message?: string;
};

export function ConnectionBanner({
  message = "Live updates are reconnecting…",
  className,
  ...props
}: ConnectionBannerProps) {
  return (
    <div
      {...props}
      className={["ui-connection-banner", className].filter(Boolean).join(" ")}
      role="status"
    >
      {message}
    </div>
  );
}
