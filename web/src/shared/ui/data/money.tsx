import type { HTMLAttributes } from "react";

import { formatUsd } from "./money";

export type MoneyProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  minor: number;
};

export function Money({ minor, className, ...props }: MoneyProps) {
  return (
    <span {...props} className={["ui-money", className].filter(Boolean).join(" ")}>
      {formatUsd(minor)}
    </span>
  );
}
