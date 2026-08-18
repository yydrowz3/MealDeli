import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { adaptOrderDetailFragment, adaptOrderSummaryFragments } from "./order-adapter";
import {
  OrdersEditOrderDocument,
  OrdersGetOrderDocument,
  OrdersGetOrdersDocument,
} from "../../../gql/graphql";
import type { Order, OrderDetailResult, OrderStatus, OrdersDiagnostic } from "../model/types";

export interface OrderGraphqlTransport {
  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult>;
}

export interface OrderRepository {
  list(status?: OrderStatus): Promise<readonly Order[]>;
  get(id: string): Promise<OrderDetailResult>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}

export class OrderRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderRepositoryError";
  }
}

export function createOrderRepository(
  transport: OrderGraphqlTransport,
  diagnostic?: OrdersDiagnostic,
): OrderRepository {
  return {
    async list(status) {
      const data = await transport.execute(OrdersGetOrdersDocument, {
        input: status ? { status } : {},
      });
      const output = data.getOrders;
      if (!output.ok) {
        throw new OrderRepositoryError(output.error ?? "Could not get orders.");
      }
      return adaptOrderSummaryFragments(output.orders ?? [], diagnostic);
    },

    async get(id) {
      const data = await transport.execute(OrdersGetOrderDocument, { input: { id } });
      if (!data.getOrder.ok || !data.getOrder.order) {
        return { kind: "not-found" };
      }
      return {
        kind: "found",
        order: adaptOrderDetailFragment(data.getOrder.order, diagnostic),
      };
    },

    async updateStatus(id, status) {
      const data = await transport.execute(OrdersEditOrderDocument, { input: { id, status } });
      if (!data.editOrder.ok) {
        throw new OrderRepositoryError(data.editOrder.error ?? "Could not update the order.");
      }
    },
  };
}
