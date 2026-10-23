import { describe, expect, it } from "vitest";

import { createFakeIdentityRepository, buildSessionUser } from "../testing/fixtures";
import {
  accessTokenAtom,
  bootstrapSessionAtom,
  clearSessionAtom,
  configureIdentityRepositoryAtom,
  createIdentityTestStore,
  identityAtom,
  sessionUserAtom,
} from "./session-atoms";

describe("identity session atoms", () => {
  it("isolates stores and never persists the access token", () => {
    const first = createIdentityTestStore({ accessToken: "secret", status: "authenticated" });
    const second = createIdentityTestStore();
    expect(first.get(accessTokenAtom)).toBe("secret");
    expect(second.get(accessTokenAtom)).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("bootstraps refresh plus me into one authenticated snapshot", async () => {
    const user = buildSessionUser();
    const repository = createFakeIdentityRepository({
      refreshAccessToken: async () => ({ ok: true, value: "fresh-token" }),
      me: async () => ({ ok: true, value: user }),
    });
    const store = createIdentityTestStore();
    store.set(configureIdentityRepositoryAtom, repository);

    await store.set(bootstrapSessionAtom);

    expect(store.get(identityAtom)).toEqual({
      status: "authenticated",
      accessToken: "fresh-token",
      user,
    });
    expect(store.get(sessionUserAtom)).toEqual(user);
  });

  it("silently becomes anonymous when refresh fails and marks expiration explicitly", async () => {
    const store = createIdentityTestStore();
    store.set(configureIdentityRepositoryAtom, createFakeIdentityRepository());
    await store.set(bootstrapSessionAtom);
    expect(store.get(identityAtom).status).toBe("anonymous");

    store.set(clearSessionAtom, { reason: "expired" });
    expect(store.get(identityAtom)).toEqual({ status: "expired", accessToken: null, user: null });
  });
});
