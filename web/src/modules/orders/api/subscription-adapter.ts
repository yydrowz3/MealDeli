import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { adaptOrderDetailRealtimeFragment } from "./order-adapter";
import { mergeOrderEvent, mergeOrderEventIntoList } from "./cache-updates";
import type { OrderRepository } from "./order-repository";
import type { FragmentType } from "../../../gql";
import {
  OrdersCookedOrdersDocument,
  OrdersDetailFragmentDoc,
  OrdersOrderUpdatesDocument,
  OrdersPendingOrdersDocument,
} from "../../../gql/graphql";
import type { Order, OrderRealtimeEvent, OrdersDiagnostic } from "../model/types";

export type OrderConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface OrderSubscriptionPort {
  orderUpdates(id: string): AsyncIterable<OrderRealtimeEvent>;
  ownerPendingOrders(): AsyncIterable<OrderRealtimeEvent>;
  courierReadyOrders(): AsyncIterable<OrderRealtimeEvent>;
}

export interface RawOrderSubscriptionTransport {
  subscribe<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): AsyncIterable<TResult | Readonly<{ data?: TResult }>>;
}

function isWrappedSubscriptionResult<TResult>(
  payload: TResult | Readonly<{ data?: TResult }>,
): payload is Readonly<{ data: TResult }> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    payload.data !== undefined
  );
}

async function* adaptOrderStream<TResult>(
  stream: AsyncIterable<TResult | Readonly<{ data?: TResult }>>,
  selectOrder: (result: TResult) => FragmentType<typeof OrdersDetailFragmentDoc>,
  diagnostic?: OrdersDiagnostic,
): AsyncIterable<OrderRealtimeEvent> {
  for await (const payload of stream) {
    const result: TResult = isWrappedSubscriptionResult(payload)
      ? payload.data
      : (payload as TResult);
    yield adaptOrderDetailRealtimeFragment(selectOrder(result), diagnostic);
  }
}

export function createOrderSubscriptionPort(
  transport: RawOrderSubscriptionTransport,
  diagnostic?: OrdersDiagnostic,
): OrderSubscriptionPort {
  return {
    orderUpdates(id) {
      return adaptOrderStream(
        transport.subscribe(OrdersOrderUpdatesDocument, { input: { id } }),
        (result) => result.orderUpdates,
        diagnostic,
      );
    },
    ownerPendingOrders() {
      return adaptOrderStream(
        transport.subscribe(OrdersPendingOrdersDocument, {}),
        (result) => result.pendingOrders,
        diagnostic,
      );
    },
    courierReadyOrders() {
      return adaptOrderStream(
        transport.subscribe(OrdersCookedOrdersDocument, {}),
        (result) => result.cookedOrders,
        diagnostic,
      );
    },
  };
}

export interface RealtimeSubscription {
  start(): Promise<void>;
  dispose(): Promise<void>;
}

type RealtimeOptions<TEvent, TAuthoritative> = Readonly<{
  connect: () => AsyncIterable<TEvent>;
  onEvent: (event: TEvent) => void;
  refetch: () => Promise<TAuthoritative>;
  onAuthoritative: (value: TAuthoritative) => void;
  onConnectionState?: (state: OrderConnectionState) => void;
  retry?: (attempt: number) => Promise<void>;
  diagnostic?: OrdersDiagnostic;
}>;

function defaultRetry(attempt: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, Math.min(1_000 * attempt, 5_000)));
}

export function createRealtimeSubscription<TEvent, TAuthoritative>(
  options: RealtimeOptions<TEvent, TAuthoritative>,
): RealtimeSubscription {
  let disposed = false;
  let running: Promise<void> | null = null;
  let iterator: AsyncIterator<TEvent> | null = null;
  let resolveDisposed: (() => void) | null = null;
  const disposedSignal = new Promise<void>((resolve) => {
    resolveDisposed = resolve;
  });
  let lastState: OrderConnectionState | null = null;

  const setState = (state: OrderConnectionState) => {
    if (lastState !== state) {
      lastState = state;
      options.onConnectionState?.(state);
    }
  };

  const run = async () => {
    let connectedBefore = false;
    let attempt = 0;
    setState("connecting");
    while (!disposed) {
      try {
        const stream = options.connect();
        iterator = stream[Symbol.asyncIterator]();
        setState("connected");
        if (connectedBefore) {
          options.onAuthoritative(await options.refetch());
        }
        connectedBefore = true;
        attempt = 0;

        while (!disposed) {
          const next = await iterator.next();
          if (next.done) {
            throw new Error("Order subscription ended.");
          }
          options.onEvent(next.value);
        }
      } catch (error) {
        if (disposed) {
          break;
        }
        attempt += 1;
        setState("reconnecting");
        options.diagnostic?.("Order subscription disconnected.", {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
        await Promise.race([(options.retry ?? defaultRetry)(attempt), disposedSignal]);
      } finally {
        const activeIterator = iterator;
        iterator = null;
        await activeIterator?.return?.();
      }
    }
    setState("disconnected");
  };

  return {
    start() {
      running ??= run();
      return running;
    },
    async dispose() {
      if (disposed) {
        await running;
        return;
      }
      disposed = true;
      resolveDisposed?.();
      await iterator?.return?.();
      await running;
    },
  };
}

export function createOrderRealtimeAdapter(options: Readonly<{
  orderId: string;
  subscriptions: OrderSubscriptionPort;
  repository: Pick<OrderRepository, "get">;
  getCurrent: () => Order;
  replace: (order: Order) => void;
  onAcceptedEvent?: (order: Order) => void;
  onConnectionState?: (state: OrderConnectionState) => void;
  retry?: (attempt: number) => Promise<void>;
  diagnostic?: OrdersDiagnostic;
}>): RealtimeSubscription {
  return createRealtimeSubscription({
    connect: () => options.subscriptions.orderUpdates(options.orderId),
    onEvent: (event) => {
      const merged = mergeOrderEvent(options.getCurrent(), event, options.diagnostic);
      if (merged.applied) {
        options.replace(merged.order);
        options.onAcceptedEvent?.(merged.order);
      }
    },
    refetch: () => options.repository.get(options.orderId),
    onAuthoritative: (result) => {
      if (result.kind === "found") {
        options.replace(result.order);
      }
    },
    onConnectionState: options.onConnectionState,
    retry: options.retry,
    diagnostic: options.diagnostic,
  });
}

export function createOwnerPendingRealtimeAdapter(options: Readonly<{
  subscriptions: OrderSubscriptionPort;
  repository: Pick<OrderRepository, "list">;
  getCurrent: () => readonly Order[];
  replace: (orders: readonly Order[]) => void;
  onNewOrder?: (order: Order) => void;
  onConnectionState?: (state: OrderConnectionState) => void;
  retry?: (attempt: number) => Promise<void>;
  diagnostic?: OrdersDiagnostic;
}>): RealtimeSubscription {
  return createRealtimeSubscription({
    connect: () => options.subscriptions.ownerPendingOrders(),
    onEvent: (event) => {
      const current = options.getCurrent();
      const next = mergeOrderEventIntoList(current, event, {
        insertIfMissing: true,
        diagnostic: options.diagnostic,
      });
      if (next !== current) {
        options.replace(next);
        if (!current.some((order) => order.id === event.id)) {
          const inserted = next.find((order) => order.id === event.id);
          if (inserted) {
            options.onNewOrder?.(inserted);
          }
        }
      }
    },
    refetch: () => options.repository.list(),
    onAuthoritative: options.replace,
    onConnectionState: options.onConnectionState,
    retry: options.retry,
    diagnostic: options.diagnostic,
  });
}
