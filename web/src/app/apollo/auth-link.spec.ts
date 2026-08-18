import { ApolloLink, Observable } from "@apollo/client";
import { parse } from "graphql";
import { describe, expect, it } from "vitest";
import { createAuthLink } from "./auth-link";

function readHeaders(token: string | null, initialHeaders?: Record<string, string>) {
  let headers: Record<string, string> | undefined;
  const terminal = new ApolloLink((operation) => {
    headers = operation.getContext().headers as Record<string, string> | undefined;
    return new Observable((observer) => {
      observer.next({ data: { viewer: null } });
      observer.complete();
    });
  });
  ApolloLink.execute(
    createAuthLink(() => token).concat(terminal),
    {
      query: parse("query Viewer { viewer { id } }"),
      context: initialHeaders ? { headers: initialHeaders } : undefined,
    },
    { client: {} as never },
  ).subscribe();
  return headers;
}

describe("auth link", () => {
  it("adds the in-memory access token", () => {
    expect(readHeaders("secret-token")).toMatchObject({ authorization: "Bearer secret-token" });
  });

  it("does not send Authorization without a token", () => {
    expect(readHeaders(null)).not.toHaveProperty("authorization");
  });

  it("preserves an operation token until the session store is updated", () => {
    expect(readHeaders(null, { authorization: "Bearer just-issued-token" })).toMatchObject({
      authorization: "Bearer just-issued-token",
    });
  });
});
