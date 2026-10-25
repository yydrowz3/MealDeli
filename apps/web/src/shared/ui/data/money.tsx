import type { HTMLAttributes } from "react";
import { useI18n } from "../../i18n";

import { formatUsd } from "./money";

export type MoneyProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  minor: number;
  locale?: string;
};

export function Money({ minor, locale, className, ...props }: MoneyProps) {
  const { locale: currentLocale } = useI18n();
  return (
    <span {...props} className={["tabular-nums", className].filter(Boolean).join(" ")}>
      {formatUsd(minor, locale ?? currentLocale)}
    </span>
  );
}
