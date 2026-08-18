import { describe, expect, it } from "vitest";

import { buildInsightsOrder, buildInsightsOrderItem } from "../testing/fixtures";
import { computeOwnerMetrics } from "./analytics";
import { buildLocalDateBuckets } from "./date-buckets";

function localIso(year: number, month: number, day: number, hour = 0, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

describe("computeOwnerMetrics", () => {
  it("uses inclusive local lower and exclusive upper seven-day boundaries", () => {
    const now = new Date(2026, 7, 17, 15);
    const buckets = buildLocalDateBuckets(now);
    const lower = buckets[0].start.toISOString();
    const upper = buckets[6].end.toISOString();
    const metrics = computeOwnerMetrics({
      now,
      orders: [
        buildInsightsOrder({ id: "lower", createdAt: lower, totalMinor: 100 }),
        buildInsightsOrder({
          id: "before-upper",
          createdAt: new Date(Date.parse(upper) - 1).toISOString(),
          totalMinor: 200,
        }),
        buildInsightsOrder({ id: "upper", createdAt: upper, totalMinor: 400 }),
      ],
    });
    expect(metrics.salesMinor).toBe(300);
    expect(metrics.orderCount).toBe(2);
    expect(metrics.dailySales).toHaveLength(7);
    expect(metrics.dailySales[0].salesMinor).toBe(100);
    expect(metrics.dailySales[6].salesMinor).toBe(200);
  });

  it("uses calendar-midnight buckets that preserve DST offset changes", () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      const buckets = buildLocalDateBuckets(new Date(2026, 2, 10, 12));
      const springForward = buckets.find((bucket) => bucket.date === "2026-03-08");
      expect(springForward).toBeDefined();
      expect(springForward!.end.getTime() - springForward!.start.getTime()).toBe(
        23 * 60 * 60 * 1000,
      );
    } finally {
      process.env.TZ = originalTimeZone;
    }
  });

  it("rounds averages, filters restaurants, and counts old active orders", () => {
    const metrics = computeOwnerMetrics({
      now: new Date(2026, 7, 17, 12),
      restaurantId: "restaurant-insights-1",
      orders: [
        buildInsightsOrder({ id: "one", totalMinor: 100, createdAt: localIso(2026, 8, 17, 8) }),
        buildInsightsOrder({
          id: "two",
          totalMinor: 101,
          createdAt: localIso(2026, 8, 16, 8),
          status: "DELIVERED",
        }),
        buildInsightsOrder({
          id: "old-active",
          totalMinor: 900,
          createdAt: localIso(2026, 7, 1, 8),
          status: "WAITING",
        }),
        buildInsightsOrder({
          id: "other",
          restaurantId: "other",
          totalMinor: 9_999,
          createdAt: localIso(2026, 8, 17, 8),
        }),
      ],
    });
    expect(metrics).toMatchObject({
      salesMinor: 201,
      orderCount: 2,
      averageOrderMinor: 101,
      activeOrderCount: 2,
    });
  });

  it("returns seven zero buckets and a zero average without orders", () => {
    const metrics = computeOwnerMetrics({ orders: [], now: new Date(2026, 7, 17, 12) });
    expect(metrics).toMatchObject({
      salesMinor: 0,
      orderCount: 0,
      averageOrderMinor: 0,
      activeOrderCount: 0,
      topDishes: [],
    });
    expect(metrics.dailySales).toHaveLength(7);
    expect(metrics.dailySales.every((bucket) => bucket.salesMinor === 0)).toBe(true);
  });

  it("aggregates item quantities with deterministic ties, a five-item limit, and missing-item diagnostics", () => {
    const diagnostic: string[] = [];
    const names = ["Zulu", "Alpha", "Echo", "Delta", "Charlie", "Bravo"];
    const orders = names.map((dishName, index) =>
      buildInsightsOrder({
        id: `order-${index}`,
        createdAt: localIso(2026, 8, 17, 8),
        items: [buildInsightsOrderItem({ dishName, quantity: index === 0 ? 4 : 2 })],
      }),
    );
    orders.push(
      buildInsightsOrder({
        id: "missing-items",
        createdAt: localIso(2026, 8, 17, 8),
        items: undefined,
        totalMinor: 500,
      } as unknown as Parameters<typeof buildInsightsOrder>[0]),
    );
    const metrics = computeOwnerMetrics({
      orders,
      now: new Date(2026, 7, 17, 12),
      diagnostic: (message) => diagnostic.push(message),
    });
    expect(metrics.topDishes).toEqual([
      { dishName: "Zulu", quantity: 4 },
      { dishName: "Alpha", quantity: 2 },
      { dishName: "Bravo", quantity: 2 },
      { dishName: "Charlie", quantity: 2 },
      { dishName: "Delta", quantity: 2 },
    ]);
    expect(metrics.orderCount).toBe(7);
    expect(diagnostic).toContain("Owner analytics could not aggregate missing order items.");
  });
});
