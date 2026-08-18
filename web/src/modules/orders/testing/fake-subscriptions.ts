import type { OrderRealtimeEvent } from "../model/types";
import type { OrderSubscriptionPort } from "../api/subscription-adapter";

type Pending<T> = Readonly<{
  resolve: (result: IteratorResult<T>) => void;
  reject: (error: unknown) => void;
}>;

export class ControllableAsyncIterable<T> implements AsyncIterable<T>, AsyncIterator<T> {
  private values: T[] = [];
  private pending: Pending<T>[] = [];
  private ended = false;
  returnCount = 0;

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }

  next(): Promise<IteratorResult<T>> {
    const value = this.values.shift();
    if (value !== undefined) {
      return Promise.resolve({ done: false, value });
    }
    if (this.ended) {
      return Promise.resolve({ done: true, value: undefined });
    }
    return new Promise((resolve, reject) => this.pending.push({ resolve, reject }));
  }

  push(value: T): void {
    const pending = this.pending.shift();
    if (pending) {
      pending.resolve({ done: false, value });
      return;
    }
    this.values.push(value);
  }

  fail(error: unknown): void {
    const pending = this.pending.shift();
    if (pending) {
      pending.reject(error);
    } else {
      this.ended = true;
    }
  }

  complete(): void {
    this.ended = true;
    this.pending.splice(0).forEach(({ resolve }) => resolve({ done: true, value: undefined }));
  }

  return(): Promise<IteratorResult<T>> {
    this.returnCount += 1;
    this.complete();
    return Promise.resolve({ done: true, value: undefined });
  }
}

export function createFakeOrderSubscriptions(
  streams: Readonly<{
    updates?: readonly ControllableAsyncIterable<OrderRealtimeEvent>[];
    pending?: readonly ControllableAsyncIterable<OrderRealtimeEvent>[];
    cooked?: readonly ControllableAsyncIterable<OrderRealtimeEvent>[];
  }>,
): OrderSubscriptionPort {
  let updateIndex = 0;
  let pendingIndex = 0;
  let cookedIndex = 0;
  return {
    orderUpdates() {
      const stream = streams.updates?.[updateIndex++];
      if (!stream) throw new Error("No update stream configured.");
      return stream;
    },
    ownerPendingOrders() {
      const stream = streams.pending?.[pendingIndex++];
      if (!stream) throw new Error("No pending stream configured.");
      return stream;
    },
    courierReadyOrders() {
      const stream = streams.cooked?.[cookedIndex++];
      if (!stream) throw new Error("No cooked stream configured.");
      return stream;
    },
  };
}

export async function flushOrdersRealtime(): Promise<void> {
  for (let turn = 0; turn < 10; turn += 1) {
    await Promise.resolve();
  }
}
