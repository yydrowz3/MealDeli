import { describe, expect, it } from "vitest";
import { RuntimeConfigError, parseRuntimeConfig } from "./runtime-config";

const validEnvironment = {
  VITE_API_HTTP_URL: "https://api.mealdeli.test/graphql",
  VITE_API_WS_URL: "wss://api.mealdeli.test/graphql",
  VITE_APP_ORIGIN: "https://mealdeli.test",
};

describe("parseRuntimeConfig", () => {
  it("maps valid absolute URLs", () => {
    expect(parseRuntimeConfig(validEnvironment)).toEqual({
      apiHttpUrl: validEnvironment.VITE_API_HTTP_URL,
      apiWsUrl: validEnvironment.VITE_API_WS_URL,
      appOrigin: validEnvironment.VITE_APP_ORIGIN,
    });
  });

  it("rejects a missing variable without a production fallback", () => {
    const { VITE_API_HTTP_URL: _missing, ...environment } = validEnvironment;
    expect(() => parseRuntimeConfig(environment)).toThrow(RuntimeConfigError);
  });

  it.each([
    ["VITE_API_HTTP_URL", "ws://api.mealdeli.test/graphql"],
    ["VITE_API_WS_URL", "https://api.mealdeli.test/graphql"],
    ["VITE_APP_ORIGIN", "https://mealdeli.test/application"],
    ["VITE_APP_ORIGIN", "not-a-url"],
  ])("rejects an invalid %s", (key, value) => {
    expect(() => parseRuntimeConfig({ ...validEnvironment, [key]: value })).toThrow(
      RuntimeConfigError,
    );
  });
});
