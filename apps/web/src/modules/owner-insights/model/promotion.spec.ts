import { describe, expect, it, vi } from "vitest";

import { buildPromotionData } from "../testing/fixtures";
import {
  createPromotionCoordinator,
  DEMO_PROMOTION,
  getPromotionState,
  type PromotionRepository,
} from "./promotion";

const NOW = new Date("2026-08-17T12:00:00.000Z");

describe("promotion model", () => {
  it("keeps the UI duration contract fixed at seven days", () => {
    expect(DEMO_PROMOTION).toEqual({ priceMinor: 999, currency: "USD", durationDays: 7 });
  });

  it("treats future values as active and expired or invalid values as inactive", () => {
    const diagnostic = vi.fn();
    expect(getPromotionState("2026-08-18T12:00:00.000Z", NOW)).toBe("active");
    expect(getPromotionState("2026-08-17T12:00:00.000Z", NOW)).toBe("inactive");
    expect(getPromotionState("not-a-date", NOW, diagnostic)).toBe("inactive");
    expect(diagnostic).toHaveBeenCalledOnce();
  });

  it("generates one transaction ID and reuses it after a timeout", async () => {
    const uuid = vi.fn(() => "00000000-0000-7000-8000-000000000009");
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({ kind: "created" });
    const repository: PromotionRepository = {
      create,
      refresh: vi.fn().mockResolvedValue(
        buildPromotionData({
          restaurant: buildPromotionData().restaurant,
        }),
      ),
    };
    repository.refresh = vi.fn().mockResolvedValue(
      buildPromotionData({
        restaurant: {
          ...buildPromotionData().restaurant,
          promotedUntil: "2026-08-24T12:00:00.000Z",
        },
      }),
    );
    const coordinator = createPromotionCoordinator({
      restaurantId: "restaurant-1",
      repository,
      uuid,
      clock: () => NOW,
    });
    expect((await coordinator.submit(null)).kind).toBe("error");
    expect((await coordinator.submit(null)).kind).toBe("activated");
    expect(uuid).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][1]).toBe(create.mock.calls[1][1]);
  });

  it("refetches a duplicate and treats an active server result as success", async () => {
    const repository: PromotionRepository = {
      create: vi.fn().mockResolvedValue({ kind: "duplicate" }),
      refresh: vi.fn().mockResolvedValue(
        buildPromotionData({
          restaurant: {
            ...buildPromotionData().restaurant,
            promotedUntil: "2026-08-24T12:00:00.000Z",
          },
        }),
      ),
    };
    const result = await createPromotionCoordinator({
      restaurantId: "restaurant-1",
      repository,
      uuid: () => "uuid",
      clock: () => NOW,
    }).submit(null);
    expect(result.kind).toBe("activated");
    expect(repository.refresh).toHaveBeenCalledOnce();
  });

  it("does not generate an ID or submit while the promotion is active", async () => {
    const repository: PromotionRepository = { create: vi.fn(), refresh: vi.fn() };
    const uuid = vi.fn(() => "uuid");
    const result = await createPromotionCoordinator({
      restaurantId: "restaurant-1",
      repository,
      uuid,
      clock: () => NOW,
    }).submit("2026-08-18T12:00:00.000Z");
    expect(result.kind).toBe("already-active");
    expect(repository.create).not.toHaveBeenCalled();
    expect(uuid).not.toHaveBeenCalled();
  });
});
