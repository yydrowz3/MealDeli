import { accessTokenAtom, createIdentityTestStore } from "../../modules/identity";
import type { IdentityRepository } from "../../modules/identity";
import { describe, expect, it, vi } from "vitest";
import { createIdentityAuthPort } from "./identity-auth-port";

const user = {
  id: "user-1",
  email: "customer@mealdeli.test",
  name: "Customer",
  role: "CUSTOMER" as const,
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: null,
  image: null,
};

function repository(): IdentityRepository {
  return {
    refreshAccessToken: vi.fn(async () => ({ ok: true as const, value: "new-token" })),
    me: vi.fn(async () => ({ ok: true as const, value: user })),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    editProfile: vi.fn(),
  };
}

describe("Identity auth port", () => {
  it("uses only Identity public atoms and notifies token subscribers after refresh", async () => {
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "old-token",
      user,
    });
    const port = createIdentityAuthPort(store, repository);
    const tokenChanged = vi.fn();
    const unsubscribe = port.subscribeAccessToken?.(tokenChanged);

    await expect(port.refreshAccessToken()).resolves.toBe("new-token");
    expect(store.get(accessTokenAtom)).toBe("new-token");
    expect(tokenChanged).toHaveBeenCalledTimes(1);
    unsubscribe?.();
  });
});
