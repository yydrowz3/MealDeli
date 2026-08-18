import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { describe, expect, it } from "vitest";

import {
  createOrderCommandRepository,
  type CheckoutGraphqlTransport,
} from "./order-command-repository";
import type { CreateOrderPayload } from "../model/types";

const payload: CreateOrderPayload = {
  restaurantId: "restaurant-1",
  items: [
    {
      dishId: "dish-1",
      quantity: 2,
      options: [{ optionId: "option-1", choiceIds: ["choice-1"] }],
    },
  ],
};

class FakeTransport implements CheckoutGraphqlTransport {
  readonly calls: unknown[][] = [];
  private readonly response: unknown;
  private readonly failure: Error | undefined;

  constructor(
    response: unknown = {
      createOrder: { ok: true, error: null, orderId: "order-1" },
    },
    failure?: Error,
  ) {
    this.response = response;
    this.failure = failure;
  }

  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    this.calls.push([document, variables]);
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve(this.response as TResult);
  }
}

describe("createOrderCommandRepository", () => {
  it("uses the generated operation and submits no snapshot names or prices", async () => {
    const transport = new FakeTransport();
    await expect(createOrderCommandRepository(transport).create(payload)).resolves.toEqual({
      kind: "success",
      orderId: "order-1",
    });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0][1]).toEqual({ input: payload });
    expect(JSON.stringify(transport.calls[0][1])).not.toMatch(/price|name/i);
  });

  it("maps business, network, and timeout outcomes", async () => {
    await expect(
      createOrderCommandRepository(
        new FakeTransport({ createOrder: { ok: false, error: "Invalid dish", orderId: null } }),
      ).create(payload),
    ).resolves.toEqual({ kind: "business-error", message: "Invalid dish" });
    await expect(
      createOrderCommandRepository(new FakeTransport(undefined, new Error("offline"))).create(
        payload,
      ),
    ).resolves.toEqual({
      kind: "network-error",
      message: "We couldn’t place your order. Try again.",
    });
    const timeout = new Error("request timed out");
    timeout.name = "TimeoutError";
    await expect(
      createOrderCommandRepository(new FakeTransport(undefined, timeout)).create(payload),
    ).resolves.toEqual({
      kind: "timeout",
      message: "We couldn’t confirm whether your order was placed.",
    });
  });
});
