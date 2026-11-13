import { describe, expect, it, vi } from "vitest";

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
    const repository = createFakeIdentityRepository();
    store.set(configureIdentityRepositoryAtom, repository);
    await store.set(bootstrapSessionAtom);
    expect(store.get(identityAtom)).toEqual({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
    expect(repository.refreshAccessToken).toHaveBeenCalledOnce();
    expect(repository.me).not.toHaveBeenCalled();

    store.set(clearSessionAtom, { reason: "expired" });
    expect(store.get(identityAtom)).toEqual({ status: "expired", accessToken: null, user: null });
  });

  it("clears a previous session when no repository is configured", async () => {
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "old-token",
      user: buildSessionUser(),
    });

    await store.set(bootstrapSessionAtom);

    expect(store.get(identityAtom)).toEqual({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  });

  it.each([true, false])(
    "retries a failed profile query once (recovered: %s)",
    async (recovers) => {
      const user = buildSessionUser();
      const failure = { ok: false, code: "NETWORK", message: "offline" } as const;
      let resolveRefresh!: (result: { ok: true; value: string }) => void;
      const refreshAccessToken = vi.fn(
        () =>
          new Promise<{ ok: true; value: string }>((resolve) => {
            resolveRefresh = resolve;
          }),
      );
      const me = vi
        .fn()
        .mockResolvedValueOnce(failure)
        .mockResolvedValueOnce(recovers ? { ok: true, value: user } : failure);
      const store = createIdentityTestStore({
        status: "authenticated",
        accessToken: "old-token",
        user,
      });
      store.set(
        configureIdentityRepositoryAtom,
        createFakeIdentityRepository({ refreshAccessToken, me }),
      );

      const bootstrap = store.set(bootstrapSessionAtom);
      expect(store.get(identityAtom)).toEqual({
        status: "checking",
        accessToken: null,
        user: null,
      });
      expect(me).not.toHaveBeenCalled();
      resolveRefresh({ ok: true, value: "fresh-token" });
      await bootstrap;

      expect(refreshAccessToken).toHaveBeenCalledOnce();
      expect(me).toHaveBeenCalledTimes(2);
      expect(me).toHaveBeenNthCalledWith(1, "fresh-token");
      expect(me).toHaveBeenNthCalledWith(2, "fresh-token");
      expect(store.get(identityAtom)).toEqual(
        recovers
          ? { status: "authenticated", accessToken: "fresh-token", user }
          : { status: "anonymous", accessToken: null, user: null },
      );
    },
  );
});
