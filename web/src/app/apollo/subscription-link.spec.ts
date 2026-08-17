import { parse } from "graphql";
import type { Client, ClientOptions } from "graphql-ws";
import { describe, expect, it, vi } from "vitest";
import { RestartableSubscriptionLink, cappedReconnectDelay } from "./subscription-link";

describe("RestartableSubscriptionLink", () => {
  it("reads the latest token and rebuilds active subscriptions once per token notification", () => {
    let token = "old-token";
    let tokenListener: (() => void) | undefined;
    const factories: ClientOptions[] = [];
    const disposeClients = vi.fn();
    const disposeSubscriptions = vi.fn();
    const subscribe = vi.fn(() => disposeSubscriptions);
    const factory = vi.fn((options: ClientOptions) => {
      factories.push(options);
      return { subscribe, dispose: disposeClients } as unknown as Client;
    });
    const link = new RestartableSubscriptionLink({
      url: "wss://api.mealdeli.test/graphql",
      getAccessToken: () => token,
      subscribeAccessToken: (listener) => {
        tokenListener = listener;
        return vi.fn();
      },
      createClient: factory,
    });
    const observable = link.request({
      query: parse("subscription OrdersChanged { ordersChanged { id } }"),
      operationName: "OrdersChanged",
      variables: {},
      extensions: {},
    } as never);
    const subscription = observable.subscribe({ next: vi.fn() });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(factories[0].connectionParams).toBeTypeOf("function");
    expect((factories[0].connectionParams as () => object)()).toEqual({ Authorization: "Bearer old-token" });

    token = "new-token";
    tokenListener?.();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(disposeClients).toHaveBeenCalledTimes(1);
    expect(disposeSubscriptions).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect((factories[1].connectionParams as () => object)()).toEqual({ Authorization: "Bearer new-token" });

    subscription.unsubscribe();
    link.dispose();
  });

  it("caps reconnect backoff at 30 seconds", () => {
    expect(cappedReconnectDelay(0)).toBe(1_000);
    expect(cappedReconnectDelay(20)).toBe(30_000);
  });
});
