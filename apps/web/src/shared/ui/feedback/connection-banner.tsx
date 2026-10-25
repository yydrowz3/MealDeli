import { message as localizedMessage, useI18n } from "../../i18n";
import type { HTMLAttributes } from "react";

export type ConnectionBannerProps = HTMLAttributes<HTMLDivElement> & {
  message?: string;
};

export function ConnectionBanner({
  message = localizedMessage("ui.reconnecting"),
  className,
  ...props
}: ConnectionBannerProps) {
  const { text } = useI18n();
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
      {text(message)}
    </div>
  );
}
