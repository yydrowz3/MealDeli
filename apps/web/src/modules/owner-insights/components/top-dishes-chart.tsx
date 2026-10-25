import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "../../../shared/ui";
import type { TopDish } from "../model/analytics";
import { ChartTooltip } from "./chart-tooltip";

export type TopDishesChartProps = Readonly<{
  dishes: readonly TopDish[];
}>;

function getTopDishesSummary(dishes: readonly TopDish[]): string {
  const top = dishes[0];
  if (!top) return localizedMessage("insights.noDishSales");
  return localizedMessage("insights.topDishSummary", { name: top.dishName, count: top.quantity });
}

export function TopDishesChart({ dishes }: TopDishesChartProps) {
  const { t, text } = useI18n();
  return (
    <ChartFrame
      emptySlot={<p>{t("insights.noDishSales")}</p>}
      state={dishes.length === 0 ? "empty" : "ready"}
      summary={text(getTopDishesSummary(dishes))}
      title={t("insights.topDishes")}
    >
      <div aria-label={t("insights.topDishesChart")} className="h-72 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={dishes} layout="vertical" margin={{ left: 18, right: 8, top: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis allowDecimals={false} stroke="var(--color-muted)" type="number" />
            <YAxis dataKey="dishName" stroke="var(--color-muted)" type="category" width={96} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-neutral-soft)" }} />
            <Bar
              dataKey="quantity"
              fill="var(--color-info)"
              name={t("common.items")}
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
