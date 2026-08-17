import { describe, expect, it } from "vitest";
import { PWA_MAP_TILE_PATTERN, PWA_RUNTIME_CACHING, PWA_SENSITIVE_REQUEST_PATTERN, PWA_UPDATE_BEHAVIOR } from "./policy";

describe("PWA policy contract", () => {
  it.each([
    "https://api.mealdeli.test/graphql",
    "https://api.mealdeli.test/uploads",
    "https://api.mealdeli.test/auth/resend-verification",
  ])("keeps sensitive request %s NetworkOnly", (url) => {
    expect(PWA_SENSITIVE_REQUEST_PATTERN.test(url)).toBe(true);
    expect(PWA_RUNTIME_CACHING.filter(({ urlPattern }) => urlPattern.test(url)).every(({ handler }) => handler === "NetworkOnly")).toBe(true);
  });

  it("never caches OpenStreetMap tiles", () => {
    expect(PWA_MAP_TILE_PATTERN.test("https://a.tile.openstreetmap.org/14/1/2.png")).toBe(true);
    expect(PWA_RUNTIME_CACHING.at(-1)?.handler).toBe("NetworkOnly");
  });

  it("prompts for updates instead of automatically reloading", () => {
    expect(PWA_UPDATE_BEHAVIOR).toEqual({ registerType: "prompt", autoReload: false });
  });
});
