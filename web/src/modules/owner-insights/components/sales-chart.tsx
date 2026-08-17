import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame, formatUsd } from "../../../shared/ui";
import type { DailySales } from "../model/analytics";
import { localDateFromKey } from "../model/date-buckets";

export type SalesChartProps = Readonly<{
  dailySales: readonly DailySales[];
}>;

function formatDay(date: string, weekday?: "short" | "long"): string {
  return new Intl.DateTimeFormat("en-US", weekday ? { weekday } : { month: "short", day: "numeric" })
    .format(localDateFromKey(date));
}

function getSalesSummary(dailySales: readonly DailySales[]): string {
  const highest = dailySales.reduce<DailySales | null>(
    (current, item) => (!current || item.salesMinor > current.salesMinor ? item : current),
    null,
  );
  if (!highest || highest.salesMinor === 0) return "No sales data for the last 7 days.";
  return `Sales were highest on ${formatDay(highest.date, "long")} at ${formatUsd(highest.salesMinor)}.`;
}

export function SalesChart({ dailySales }: SalesChartProps) {
  const summary = getSalesSummary(dailySales);
  const empty = dailySales.every((item) => item.salesMinor === 0);
  const chartData = dailySales.map((item) => ({
    ...item,
    label: formatDay(item.date),
    sales: item.salesMinor / 100,
  }));
  return (
    <ChartFrame
      emptySlot={<p>No sales data for the last 7 days.</p>}
      state={empty ? "empty" : "ready"}
      summary={summary}
      title="Sales · Last 7 days"
    >
      <div aria-label="Daily sales chart" className="owner-insights-chart" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(value: number) => `$${value}`} width={56} />
            <Tooltip formatter={(value) => formatUsd(Math.round(Number(value) * 100))} />
            <Bar dataKey="sales" fill="var(--color-jade)" name="Sales" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
