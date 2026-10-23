import { describe, expect, it, vi } from "vitest";

import { createFakeIdentityRepository } from "../testing/fixtures";
import { logoutLocallyFirst } from "./logout";
import { createIdentityTestStore, identityAtom } from "./session-atoms";

describe("logoutLocallyFirst", () => {
  it("clears local state before a failing network request settles", async () => {
    let reject!: (error: Error) => void;
    const signOut = vi
      .fn()
      .mockImplementation(() => new Promise((_resolve, fail) => (reject = fail)));
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "secret",
      user: buildUser(),
    });

    const pending = logoutLocallyFirst(store, createFakeIdentityRepository({ signOut }));
    expect(store.get(identityAtom)).toEqual({ status: "anonymous", accessToken: null, user: null });
    reject(new Error("offline"));
    await expect(pending).resolves.toBeUndefined();
  });
});

function buildUser() {
  return {
    id: "user-1",
    email: "alex@example.test",
    name: "Alex",
    role: "CUSTOMER" as const,
    verifiedAt: "2026-08-17T00:00:00.000Z",
    address: null,
    image: null,
  };
}
