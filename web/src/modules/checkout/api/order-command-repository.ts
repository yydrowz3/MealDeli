import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { CheckoutCreateOrderDocument } from "../../../gql/graphql";
import type { CreateOrderPayload, OrderCommandRepository } from "../model/types";

export interface CheckoutGraphqlTransport {
  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult>;
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || /timed?\s*out|timeout/i.test(error.message);
}

function mutablePayload(payload: CreateOrderPayload) {
  return {
    restaurantId: payload.restaurantId,
    items: payload.items.map((item) => ({
      dishId: item.dishId,
      quantity: item.quantity,
      ...(item.options
        ? {
            options: item.options.map((option) => ({
              optionId: option.optionId,
              choiceIds: [...option.choiceIds],
            })),
          }
        : {}),
    })),
  };
}

export function createOrderCommandRepository(
  transport: CheckoutGraphqlTransport,
): OrderCommandRepository {
  return {
    async create(payload) {
      try {
        const data = await transport.execute(CheckoutCreateOrderDocument, {
          input: mutablePayload(payload),
        });
        const output = data.createOrder;
        if (output.ok && output.orderId) return { kind: "success", orderId: output.orderId };
        return {
          kind: "business-error",
          message: output.error ?? "We couldn’t place your order. Try again.",
        };
      } catch (error) {
        if (isTimeout(error)) {
          return {
            kind: "timeout",
            message: "We couldn’t confirm whether your order was placed.",
          };
        }
        return {
          kind: "network-error",
          message: "We couldn’t place your order. Try again.",
        };
      }
    },
  };
}
