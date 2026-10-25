import type { ReactNode } from "react";

type ChartTooltipProps = {
  active?: boolean;
  label?: ReactNode;
  payload?: readonly { name?: string | number; value?: number | string }[];
  formatValue?: (value: number) => string;
};

export function ChartTooltip({ active, label, payload, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-solid border-border bg-surface p-3 text-small text-charcoal shadow-[0_2px_8px_var(--color-shadow)]">
      <p className="m-0 font-bold">{label}</p>
      {payload.map((entry, index) => (
        <p className="m-0" key={index}>
          {entry.name}: {formatValue ? formatValue(Number(entry.value)) : entry.value}
        </p>
      ))}
    </div>
  );
}
