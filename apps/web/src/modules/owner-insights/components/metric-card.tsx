import type { ReactNode } from "react";

import { Card } from "../../../shared/ui";

export type MetricCardProps = Readonly<{
  label: string;
  value: ReactNode;
  description: string;
}>;

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card className="grid gap-2">
      <p className="m-0 text-muted">{label}</p>
      <strong className="text-[clamp(1.6rem,3vw,2.15rem)]">{value}</strong>
      <small className="m-0 text-muted">{description}</small>
    </Card>
  );
}
