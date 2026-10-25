import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "../../../shared/ui";
import type { TopDish } from "../model/analytics";
import { ChartTooltip } from "./chart-tooltip";

export type TopDishesChartProps = Readonly<{
  dishes: readonly TopDish[];
}>;

function getTopDishesSummary(dishes: readonly TopDish[]): string {
  const top = dishes[0];
  if (!top) return "No dish sales data for the last 7 days.";
  return `${top.dishName} was the top dish with ${top.quantity} item${top.quantity === 1 ? "" : "s"}.`;
}

export function TopDishesChart({ dishes }: TopDishesChartProps) {
  return (
    <ChartFrame
      emptySlot={<p>No dish sales data for the last 7 days.</p>}
      state={dishes.length === 0 ? "empty" : "ready"}
      summary={getTopDishesSummary(dishes)}
      title="Top dishes"
    >
      <div aria-label="Top dishes chart" className="h-72 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={dishes} layout="vertical" margin={{ left: 18, right: 8, top: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis allowDecimals={false} stroke="var(--color-muted)" type="number" />
            <YAxis dataKey="dishName" stroke="var(--color-muted)" type="category" width={96} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-neutral-soft)" }} />
            <Bar dataKey="quantity" fill="var(--color-info)" name="Items" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
