import { gql } from "@apollo/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApolloClient } from "./create-apollo-client";

describe("HTTP transport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses include credentials and the current in-memory bearer token", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(
        new Response(JSON.stringify({ data: { health: "ok" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const services = createApolloClient({
      config: {
        apiHttpUrl: "https://api.mealdeli.test/graphql",
        apiWsUrl: "wss://api.mealdeli.test/graphql",
        appOrigin: "https://mealdeli.test",
      },
      auth: {
        getAccessToken: () => "memory-only-token",
        refreshAccessToken: () => Promise.resolve("memory-only-token"),
        clearSession: vi.fn(),
      },
    });

    await services.apolloClient.query({
      query: gql`
        query PlatformHealth {
          health
        }
      `,
    });
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toBe("https://api.mealdeli.test/graphql");
    expect(request[1]).toMatchObject({ credentials: "include" });
    const headers = new Headers(request[1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer memory-only-token");
    services.subscriptionLink.dispose();
  });
});
