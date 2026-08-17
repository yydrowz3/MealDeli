import { ApolloLink, CombinedGraphQLErrors, Observable } from "@apollo/client";
import { parse } from "graphql";
import { firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { createSessionErrorLink } from "./error-link";

const unauthorized = new CombinedGraphQLErrors(
  { data: null },
  [{ message: "Unauthorized", extensions: { code: "UNAUTHENTICATED" } }],
);

function execute(link: ApolloLink, query: string, context?: Record<string, unknown>) {
  return firstValueFrom(
    ApolloLink.execute(
      link,
      { query: parse(query), context },
      { client: {} as never },
    ),
  );
}

describe("session error link", () => {
  it("refreshes and retries a query at most once", async () => {
    const refresh = vi.fn(() => Promise.resolve("new-token"));
    let calls = 0;
    const terminal = new ApolloLink(() => new Observable((observer) => {
      calls += 1;
      observer.error(unauthorized);
    }));

    await expect(execute(createSessionErrorLink({ refresh }).concat(terminal), "query Orders { orders { id } }")).rejects.toBe(unauthorized);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
  });

  it("does not blindly replay a non-idempotent mutation", async () => {
    const refresh = vi.fn(() => Promise.resolve("new-token"));
    const terminal = new ApolloLink(() => new Observable((observer) => observer.error(unauthorized)));

    await expect(execute(createSessionErrorLink({ refresh }).concat(terminal), "mutation PlaceOrder { placeOrder { id } }")).rejects.toBe(unauthorized);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("retries a mutation only when its repository marks it safe", async () => {
    const refresh = vi.fn(() => Promise.resolve("new-token"));
    let calls = 0;
    const terminal = new ApolloLink(() => new Observable((observer) => {
      calls += 1;
      if (calls === 1) observer.error(unauthorized);
      else {
        observer.next({ data: { updateProfile: { id: "user-1" } } });
        observer.complete();
      }
    }));

    await expect(execute(
      createSessionErrorLink({ refresh }).concat(terminal),
      "mutation UpdateProfile { updateProfile { id } }",
      { retryOnUnauthorized: true },
    )).resolves.toMatchObject({ data: { updateProfile: { id: "user-1" } } });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
  });
});
