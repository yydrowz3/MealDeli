import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OwnerRestaurant } from "../../owner-management";
import { buildInsightsOrder } from "../testing/fixtures";
import { OwnerDashboardPage } from "./owner-dashboard-page";

const restaurant: OwnerRestaurant = {
  id: "restaurant-insights-1",
  name: "Jade Kitchen",
  address: "100 Market Street",
  image: null,
  promotedUntil: null,
  category: { id: "category-1", name: "Healthy", slug: "healthy" },
  dishes: [],
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("OwnerDashboardPage", () => {
  it("shows onboarding without zero-value analytics when there are no restaurants", () => {
    render(
      <OwnerDashboardPage
        clock={() => new Date(2026, 7, 17, 12)}
        onRestaurantChange={vi.fn()}
        orders={[]}
        restaurants={[]}
        selectedRestaurantId={null}
      />,
    );
    expect(screen.getByText("Create your first restaurant")).toBeVisible();
    expect(screen.queryByLabelText("Owner metrics")).not.toBeInTheDocument();
    expect(screen.getByText("Restaurant details")).toBeVisible();
  });

  it("renders four metrics, supports All/single selection, and caps active orders at eight", () => {
    const onRestaurantChange = vi.fn();
    const orders = Array.from({ length: 9 }, (_, index) =>
      buildInsightsOrder({
        id: `active-order-${index}`,
        createdAt: new Date(2026, 7, 17, 12, index).toISOString(),
        totalMinor: 100,
      }),
    );
    render(
      <OwnerDashboardPage
        clock={() => new Date(2026, 7, 17, 15)}
        onRestaurantChange={onRestaurantChange}
        orders={orders}
        restaurants={[restaurant]}
        selectedRestaurantId={null}
      />,
    );
    const metrics = screen.getByLabelText("Owner metrics");
    expect(within(metrics).getByText("$9.00")).toBeVisible();
    expect(within(metrics).getAllByText("9", { selector: "strong" })).toHaveLength(2);
    expect(screen.getAllByText(/Order #active-o/)).toHaveLength(8);
    fireEvent.change(screen.getByLabelText("Restaurant"), { target: { value: restaurant.id } });
    expect(onRestaurantChange).toHaveBeenCalledWith(restaurant.id);
  });
});
