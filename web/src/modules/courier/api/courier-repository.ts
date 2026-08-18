import type { Order, OrderDetailResult, OrderRepository, OrderStatus } from "../../orders";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import {
  CourierAvailableOrdersDocument,
  CourierOrderFragmentDoc,
  CourierTakeOrderDocument,
  type CourierOrderFragment,
} from "../../../gql/graphql";
import { useFragment as readFragment } from "../../../gql";

export type TakeOrderResult =
  | Readonly<{ kind: "success" }>
  | Readonly<{ kind: "no-longer-available" }>
  | Readonly<{ kind: "already-active" }>
  | Readonly<{ kind: "timeout" }>
  | Readonly<{ kind: "error" }>;

export type CompleteOrderResult =
  | Readonly<{ kind: "success" }>
  | Readonly<{ kind: "already-delivered" }>
  | Readonly<{ kind: "assignment-lost" }>
  | Readonly<{ kind: "timeout" }>
  | Readonly<{ kind: "error" }>;

export interface CourierRepository {
  availableOrders(): Promise<readonly Order[]>;
  listOrders(status: Extract<OrderStatus, "PICKED" | "DELIVERED">): Promise<readonly Order[]>;
  getOrder(id: string): Promise<OrderDetailResult>;
  takeOrder(id: string): Promise<TakeOrderResult>;
  completeOrder(id: string): Promise<CompleteOrderResult>;
}

export type CourierCommandPort = Readonly<{
  availableOrders(): Promise<readonly Order[]>;
  takeOrder(id: string): Promise<TakeOrderResult>;
  completeOrder(id: string): Promise<CompleteOrderResult>;
}>;

export interface CourierGraphqlTransport {
  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult>;
}

function adaptCourierOrder(order: CourierOrderFragment): Order {
  return {
    id: order.id,
    customerId: order.customerId,
    courierId: order.courierId,
    restaurantId: order.restaurantId,
    restaurant: order.restaurant
      ? {
          id: order.restaurant.id,
          name: order.restaurant.name,
          address: order.restaurant.address,
          image: order.restaurant.image,
        }
      : null,
    status: order.status,
    totalMinor: order.totalMinor,
    createdAt: String(order.createdAt),
    updatedAt: String(order.updatedAt),
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      position: item.position,
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor,
      selectedOptions: item.selectedOptions.map((option) => ({
        optionId: option.optionId,
        name: option.name,
        choices: option.choices.map((choice) => ({
          choiceId: choice.choiceId,
          name: choice.name,
          extraMinor: choice.extraMinor,
        })),
      })),
    })),
  };
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || /timed?\s*out|timeout/i.test(error.message))
  );
}

export function createCourierGraphqlCommandPort(
  transport: CourierGraphqlTransport,
  orders: Pick<OrderRepository, "get" | "updateStatus">,
): CourierCommandPort {
  return {
    async availableOrders() {
      const data = await transport.execute(CourierAvailableOrdersDocument, {});
      if (!data.availableOrders.ok) {
        throw new Error(data.availableOrders.error ?? "Could not get available orders.");
      }
      return (data.availableOrders.orders ?? []).map((order) =>
        adaptCourierOrder(readFragment(CourierOrderFragmentDoc, order)),
      );
    },
    async takeOrder(id) {
      try {
        const data = await transport.execute(CourierTakeOrderDocument, { input: { id } });
        if (data.takeOrder.ok) return { kind: "success" };
        const error = data.takeOrder.error ?? "";
        if (error === "Order is no longer available.") return { kind: "no-longer-available" };
        if (error === "You already have an active delivery.") return { kind: "already-active" };
        return { kind: "error" };
      } catch (error) {
        return isTimeout(error) ? { kind: "timeout" } : { kind: "error" };
      }
    },
    async completeOrder(id) {
      try {
        const current = await orders.get(id);
        if (current.kind === "not-found") return { kind: "assignment-lost" };
        if (current.order.status === "DELIVERED") return { kind: "already-delivered" };
        await orders.updateStatus(id, "DELIVERED");
        return { kind: "success" };
      } catch (error) {
        if (isTimeout(error)) return { kind: "timeout" };
        const message = error instanceof Error ? error.message : String(error);
        if (/not assigned|permission denied/i.test(message)) return { kind: "assignment-lost" };
        if (/invalid order status transition/i.test(message)) {
          const reconciliation = await orders.get(id);
          if (reconciliation.kind === "not-found") return { kind: "assignment-lost" };
          if (reconciliation.order.status === "DELIVERED") return { kind: "already-delivered" };
        }
        return { kind: "error" };
      }
    },
  };
}

export function createCourierRepository(
  commands: CourierCommandPort,
  orders: Pick<OrderRepository, "list" | "get">,
): CourierRepository {
  return {
    availableOrders: commands.availableOrders,
    listOrders(status) {
      return orders.list(status);
    },
    getOrder(id) {
      return orders.get(id);
    },
    takeOrder: commands.takeOrder,
    completeOrder: commands.completeOrder,
  };
}
