import type { JotaiStore } from "../../identity";
import type { Order, OrderRepository } from "../../orders";

import { cartAtom, clearCartAtom } from "./cart-atoms";
import type {
  CartState,
  CheckoutSubmitResult,
  CreateOrderPayload,
  OrderCommandRepository,
} from "./types";

export function mapCartToCreateOrderPayload(cart: CartState): CreateOrderPayload {
  if (!cart.restaurant || cart.lines.length === 0) {
    throw new Error("Cannot create an order from an empty cart.");
  }
  return {
    restaurantId: cart.restaurant.id,
    items: cart.lines.map((line) => ({
      dishId: line.dishId,
      quantity: line.quantity,
      ...(line.options.length > 0
        ? {
            options: line.options.map((option) => ({
              optionId: option.optionId,
              choiceIds: option.choices.map((choice) => choice.choiceId),
            })),
          }
        : {}),
    })),
  };
}

function normalizedPayloadItems(payload: CreateOrderPayload) {
  return payload.items.map((item) => ({
    dishId: item.dishId,
    quantity: item.quantity,
    options: (item.options ?? [])
      .map((option) => ({
        optionId: option.optionId,
        choiceIds: [...option.choiceIds].sort(),
      }))
      .sort((left, right) => left.optionId.localeCompare(right.optionId)),
  }));
}

function normalizedOrderItems(order: Order) {
  return [...order.items]
    .sort((left, right) => left.position - right.position)
    .map((item) => ({
      dishId: item.dishId,
      quantity: item.quantity,
      options: item.selectedOptions
        .map((option) => ({
          optionId: option.optionId,
          choiceIds: option.choices.map((choice) => choice.choiceId).sort(),
        }))
        .sort((left, right) => left.optionId.localeCompare(right.optionId)),
    }));
}

export function createRecentOrderReconciler(repository: OrderRepository) {
  return async (payload: CreateOrderPayload, submittedAt: number): Promise<string | null> => {
    const orders = await repository.list();
    const expected = JSON.stringify(normalizedPayloadItems(payload));
    const match = orders.find(
      (order) =>
        order.restaurantId === payload.restaurantId &&
        Date.parse(order.createdAt) >= submittedAt - 5_000 &&
        JSON.stringify(normalizedOrderItems(order)) === expected,
    );
    return match?.id ?? null;
  };
}

export type CheckoutCoordinatorOptions = Readonly<{
  store: JotaiStore;
  repository: OrderCommandRepository;
  reconcile: (payload: CreateOrderPayload, submittedAt: number) => Promise<string | null>;
  now?: () => number;
  onOrderCreated?: (orderId: string) => void | Promise<void>;
}>;

export function createCheckoutCoordinator(options: CheckoutCoordinatorOptions) {
  let inFlight: Promise<CheckoutSubmitResult> | null = null;

  const submit = () => {
    if (inFlight) return inFlight;
    const cart = options.store.get(cartAtom);
    if (!cart.restaurant || cart.lines.length === 0) {
      return Promise.resolve<CheckoutSubmitResult>({ kind: "empty-cart" });
    }
    const fingerprint = JSON.stringify(cart);
    const payload = mapCartToCreateOrderPayload(cart);
    const submittedAt = (options.now ?? Date.now)();
    const task: Promise<CheckoutSubmitResult> = (async (): Promise<CheckoutSubmitResult> => {
      const result = await options.repository.create(payload);
      let orderId: string | null = null;
      let reconciled = false;
      if (result.kind === "success") {
        orderId = result.orderId;
      } else if (result.kind === "timeout") {
        try {
          orderId = await options.reconcile(payload, submittedAt);
          reconciled = orderId !== null;
        } catch {
          orderId = null;
        }
        if (!orderId) return { kind: "timeout-unresolved", message: result.message };
      } else {
        return { kind: "error", message: result.message };
      }

      if (JSON.stringify(options.store.get(cartAtom)) !== fingerprint) {
        return { kind: "cart-changed" };
      }
      options.store.set(clearCartAtom);
      await options.onOrderCreated?.(orderId);
      return { kind: "success", orderId, reconciled };
    })().finally(() => {
      inFlight = null;
    });
    inFlight = task;
    return task;
  };

  return {
    submit,
    get isSubmitting() {
      return inFlight !== null;
    },
  };
}
