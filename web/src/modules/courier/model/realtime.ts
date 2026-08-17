import {
  createRealtimeSubscription,
  type Order,
  type OrderConnectionState,
  type OrderSubscriptionPort,
  type RealtimeSubscription,
} from "../../orders";

import { isCompleteAvailableEvent, mergeAvailableOrders } from "./available-orders";

export function createCourierAvailableRealtimeAdapter(options: Readonly<{
  subscriptions: OrderSubscriptionPort;
  refetch: () => Promise<readonly Order[]>;
  getCurrent: () => readonly Order[];
  replace: (orders: readonly Order[]) => void;
  onConnectionState?: (state: OrderConnectionState) => void;
  retry?: (attempt: number) => Promise<void>;
}>): RealtimeSubscription {
  return createRealtimeSubscription({
    connect: () => options.subscriptions.courierReadyOrders(),
    onEvent: (event) => {
      if (!isCompleteAvailableEvent(event)) return;
      options.replace(mergeAvailableOrders(options.getCurrent(), [event]));
    },
    refetch: options.refetch,
    onAuthoritative: (orders) => {
      options.replace(mergeAvailableOrders([], orders));
    },
    onConnectionState: options.onConnectionState,
    retry: options.retry,
  });
}

