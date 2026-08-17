import type { ReactNode } from "react";

import { Card } from "../../../shared/ui";

export type MetricCardProps = Readonly<{
  label: string;
  value: ReactNode;
  description: string;
}>;

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card className="owner-insights-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{description}</small>
    </Card>
  );
}
