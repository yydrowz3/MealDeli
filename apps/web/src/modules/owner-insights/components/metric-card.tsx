import type { ReactNode } from "react";
import { useI18n } from "../../../shared/i18n";

import { Card } from "../../../shared/ui";

export type MetricCardProps = Readonly<{
  label: string;
  value: ReactNode;
  description: string;
}>;

export function MetricCard({ label, value, description }: MetricCardProps) {
  const { formatNumber } = useI18n();
  return (
    <Card className="grid gap-2">
      <p className="text-muted">{label}</p>
      <strong className="text-3xl">
        {typeof value === "number" ? formatNumber(value) : value}
      </strong>
      <small className="text-muted">{description}</small>
    </Card>
  );
}
