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
      className={[
        "rounded-control border border-solid border-info bg-info-soft px-4 py-3 font-sans text-info-dark",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {message}
    </div>
  );
}
