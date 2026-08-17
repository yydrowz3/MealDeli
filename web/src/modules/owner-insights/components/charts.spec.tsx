import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SalesChart } from "./sales-chart";
import { TopDishesChart } from "./top-dishes-chart";

describe("owner insight charts", () => {
  it("renders readable summaries alongside both charts", () => {
    render(
      <div className="owner-insights-charts">
        <SalesChart
          dailySales={[
            { date: "2026-08-11", salesMinor: 100 },
            { date: "2026-08-12", salesMinor: 42_050 },
          ]}
        />
        <TopDishesChart dishes={[{ dishName: "Garden bowl", quantity: 4 }]} />
      </div>,
    );
    expect(screen.getByText("Sales were highest on Wednesday at $420.50.")).toBeVisible();
    expect(screen.getByText("Garden bowl was the top dish with 4 items.")).toBeVisible();
    expect(screen.getByRole("img", { name: "Daily sales chart" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Top dishes chart" })).toBeInTheDocument();
    expect(screen.getByText("Sales · Last 7 days").closest("figure")?.parentElement).toHaveClass("owner-insights-charts");
  });

  it("shows explicit empty copy instead of misleading zero charts", () => {
    render(
      <>
        <SalesChart dailySales={Array.from({ length: 7 }, (_, index) => ({ date: `2026-08-${11 + index}`, salesMinor: 0 }))} />
        <TopDishesChart dishes={[]} />
      </>,
    );
    const salesFrame = screen.getByText("Sales · Last 7 days").closest("figure")!;
    expect(within(salesFrame).getAllByText("No sales data for the last 7 days.")).toHaveLength(2);
    expect(within(salesFrame).queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByText("No dish sales data for the last 7 days.")).toHaveLength(2);
  });
});
