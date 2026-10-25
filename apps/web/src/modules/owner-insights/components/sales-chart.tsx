import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame, formatUsd } from "../../../shared/ui";
import type { DailySales } from "../model/analytics";
import { localDateFromKey } from "../model/date-buckets";
import { ChartTooltip } from "./chart-tooltip";

export type SalesChartProps = Readonly<{
  dailySales: readonly DailySales[];
}>;

function formatDay(date: string, locale: string, weekday?: "short" | "long"): string {
  return new Intl.DateTimeFormat(
    locale,
    weekday ? { weekday } : { month: "short", day: "numeric" },
  ).format(localDateFromKey(date));
}

function getSalesSummary(dailySales: readonly DailySales[], locale: string): string {
  const highest = dailySales.reduce<DailySales | null>(
    (current, item) => (!current || item.salesMinor > current.salesMinor ? item : current),
    null,
  );
  if (!highest || highest.salesMinor === 0) return localizedMessage("insights.noSales");
  return localizedMessage("insights.highestSales", {
    day: formatDay(highest.date, locale, "long"),
    amount: formatUsd(highest.salesMinor, locale),
  });
}

export function SalesChart({ dailySales }: SalesChartProps) {
  const { t, text, locale } = useI18n();
  const summary = getSalesSummary(dailySales, locale);
  const empty = dailySales.every((item) => item.salesMinor === 0);
  const chartData = dailySales.map((item) => ({
    ...item,
    label: formatDay(item.date, locale),
    sales: item.salesMinor / 100,
  }));
  return (
    <ChartFrame
      emptySlot={<p>{t("insights.noSales")}</p>}
      state={empty ? "empty" : "ready"}
      summary={text(summary)}
      title={t("insights.salesTitle")}
    >
      <div aria-label={t("insights.salesChart")} className="h-72 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-muted)" />
            <YAxis
              stroke="var(--color-muted)"
              tickFormatter={(value: number) =>
                new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value)
              }
              width={56}
            />
            <Tooltip
              content={
                <ChartTooltip formatValue={(value) => formatUsd(Math.round(value * 100), locale)} />
              }
              cursor={{ fill: "var(--color-neutral-soft)" }}
            />
            <Bar
              dataKey="sales"
              fill="var(--color-jade)"
              name={t("insights.sales")}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
