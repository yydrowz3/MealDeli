import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

import { testServer } from "../../../../test/server";
import { createOwnerInsightsHandlers } from "../testing/handlers";
import { createPromotionRepository, PromotionRepositoryError } from "./promotion-repository";

const transport = {
  async execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    const response = await fetch("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: print(document), variables }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = (await response.json()) as { data?: TResult; errors?: unknown[] };
    if (!result.data || result.errors?.length) throw new Error("GraphQL request failed");
    return result.data;
  },
};

afterEach(() => testServer.resetHandlers());

describe("promotion repository", () => {
  it("loads the owned restaurant and demo history through MSW", async () => {
    testServer.use(...createOwnerInsightsHandlers());
    const result = await createPromotionRepository(transport).refresh("00000000-0000-7000-8000-000000000001");
    expect(result?.restaurant.name).toBe("Jade Kitchen");
    expect(result?.payments[0]).toMatchObject({ restaurantName: "Jade Kitchen", transactionId: expect.stringMatching(/^demo_/) });
  });

  it("maps duplicate business errors for refetch coordination", async () => {
    testServer.use(...createOwnerInsightsHandlers({ createError: "This transaction has already been processed." }));
    await expect(createPromotionRepository(transport).create("00000000-0000-7000-8000-000000000001", "demo_uuid"))
      .resolves.toEqual({ kind: "duplicate" });
  });

  it("surfaces a network failure as a repository error", async () => {
    testServer.use(...createOwnerInsightsHandlers({ networkError: true }));
    await expect(createPromotionRepository(transport).create("00000000-0000-7000-8000-000000000001", "demo_uuid"))
      .rejects.toBeInstanceOf(PromotionRepositoryError);
  });

  it("returns not-found only for safe ownership and missing restaurant errors", async () => {
    const execute = vi.fn().mockResolvedValueOnce({
      myRestaurant: { ok: false, error: "Restaurant not found", restaurant: null },
    });
    await expect(createPromotionRepository({ execute }).refresh("missing")).resolves.toBeNull();

    execute.mockResolvedValueOnce({
      myRestaurant: { ok: false, error: "Permission denied", restaurant: null },
    });
    await expect(createPromotionRepository({ execute }).refresh("denied")).resolves.toBeNull();
  });

  it("rejects unsafe restaurant and history business failures", async () => {
    const restaurantFailure = vi.fn().mockResolvedValueOnce({
      myRestaurant: { ok: false, error: "Database unavailable", restaurant: null },
    });
    await expect(
      createPromotionRepository({ execute: restaurantFailure }).refresh("restaurant-1"),
    ).rejects.toThrow("Database unavailable");

    const restaurant = {
      __typename: "Restaurant",
      id: "restaurant-1",
      name: "Jade Kitchen",
      promotedUntil: null,
    };
    const historyFailure = vi
      .fn()
      .mockResolvedValueOnce({ myRestaurant: { ok: true, error: null, restaurant } })
      .mockResolvedValueOnce({
        getPayments: { ok: false, error: "Payments failed", payments: null },
        myRestaurants: { ok: true, error: null, restaurants: [] },
      });
    await expect(
      createPromotionRepository({ execute: historyFailure }).refresh("restaurant-1"),
    ).rejects.toThrow("Payments failed");
  });

  it("maps created and ordinary business failures", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ createPayment: { ok: true, error: null } })
      .mockResolvedValueOnce({ createPayment: { ok: false, error: "Payment declined" } })
      .mockResolvedValueOnce({ createPayment: { ok: false, error: null } });
    const repository = createPromotionRepository({ execute });
    await expect(repository.create("restaurant-1", "demo_1")).resolves.toEqual({ kind: "created" });
    await expect(repository.create("restaurant-1", "demo_2")).resolves.toEqual({
      kind: "failed",
      message: "Payment declined",
    });
    await expect(repository.create("restaurant-1", "demo_3")).resolves.toEqual({
      kind: "failed",
      message: "We couldn’t activate the promotion. Try again.",
    });
  });
});
