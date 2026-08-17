import type { ApolloClient } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { waitFor } from "@testing-library/react";
import { parse } from "graphql";
import { graphql, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { identityAtom } from "../../modules/identity";
import { testServer } from "../../../test/server";
import {
  createApolloOperationTransport,
  createMealDeliRuntime,
  getMealDeliRuntime,
  initializeMealDeliRuntime,
} from "./app-runtime";

const config = {
  apiHttpUrl: "http://localhost/graphql",
  apiWsUrl: "ws://localhost/graphql",
  appOrigin: "http://localhost",
};

function document<TResult = unknown, TVariables = Record<string, never>>(source: string) {
  return parse(source) as TypedDocumentNode<TResult, TVariables>;
}

describe("Apollo operation transport", () => {
  it("executes query and mutation documents and rejects empty data", async () => {
    const query = vi.fn().mockResolvedValue({ data: { value: "query" } });
    const mutate = vi.fn().mockResolvedValue({ data: { value: "mutation" } });
    const client = { query, mutate } as unknown as ApolloClient;
    const transport = createApolloOperationTransport(client);
    const queryDocument = document<{ value: string }>("query Value { value }");
    const mutationDocument = document<{ value: string }>("mutation Value { value }");

    await expect(transport.execute(queryDocument, {})).resolves.toEqual({ value: "query" });
    await expect(transport.execute(mutationDocument, {})).resolves.toEqual({ value: "mutation" });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: "network-only" }));
    expect(mutate).toHaveBeenCalledOnce();

    query.mockResolvedValueOnce({ data: null });
    await expect(transport.execute(queryDocument, {})).rejects.toThrow("returned no data");
  });

  it("adapts Apollo subscription results into an async iterable and unsubscribes", async () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn((observer: { next(value: unknown): void; complete(): void }) => {
      observer.next({ data: { value: "live" } });
      observer.complete();
      return { unsubscribe };
    });
    const client = {
      subscribe: vi.fn(() => ({ subscribe })),
    } as unknown as ApolloClient;
    const transport = createApolloOperationTransport(client);
    const values = [];
    for await (const value of transport.subscribe(
      document<{ value: string }>("subscription Value { value }"),
      {},
    )) {
      values.push(value);
    }
    expect(values).toEqual([{ data: { value: "live" } }]);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("propagates subscription failures after releasing the observer", async () => {
    const failure = new Error("socket closed");
    const unsubscribe = vi.fn();
    const client = {
      subscribe: vi.fn(() => ({
        subscribe(observer: { error(error: Error): void }) {
          observer.error(failure);
          return { unsubscribe };
        },
      })),
    } as unknown as ApolloClient;
    const stream = createApolloOperationTransport(client).subscribe(
      document("subscription Value { value }"),
      {},
    );
    await expect(
      (async () => {
        for await (const _value of stream) {
          // The error-only stream never yields.
        }
      })(),
    ).rejects.toThrow("socket closed");
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe("MealDeli runtime", () => {
  it("bootstraps an anonymous session, clears private state, and disposes", async () => {
    testServer.use(
      graphql.mutation("IdentityRefreshAccessToken", () =>
        HttpResponse.json({ data: { refreshAccessToken: { ok: false, error: "No session" } } }),
      ),
    );
    const runtime = createMealDeliRuntime(config);
    await waitFor(() => expect(runtime.services.jotaiStore.get(identityAtom).status).toBe("anonymous"));
    expect(() => runtime.clearPrivateState()).not.toThrow();
    expect(() => runtime.dispose()).not.toThrow();
  });

  it("bootstraps an authenticated session and exposes one initialized singleton", async () => {
    testServer.use(
      graphql.mutation("IdentityRefreshAccessToken", () =>
        HttpResponse.json({
          data: { refreshAccessToken: { ok: true, error: null, accessToken: "access-token" } },
        }),
      ),
      graphql.query("IdentityMe", () =>
        HttpResponse.json({
          data: {
            me: {
              __typename: "User",
              id: "customer-1",
              email: "customer@example.com",
              name: "Customer",
              role: "CUSTOMER",
              verifiedAt: "2026-08-17T00:00:00.000Z",
              address: "1 Jade Way",
              image: null,
            },
          },
        }),
      ),
    );
    const runtime = initializeMealDeliRuntime(config);
    await waitFor(() =>
      expect(runtime.services.jotaiStore.get(identityAtom).status).toBe("authenticated"),
    );
    expect(getMealDeliRuntime()).toBe(runtime);
    expect(initializeMealDeliRuntime(config)).toBe(runtime);
    runtime.dispose();
  });
});
