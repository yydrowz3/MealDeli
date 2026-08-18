import { describe, expect, it, vi } from "vitest";

import { createIdentityMediaAuthPort } from "./media-auth-port";
import { accessTokenAtom, createIdentityTestStore } from "./session-atoms";
import type { IdentityRepository, SessionUser } from "./types";

const user: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  role: "CUSTOMER",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: null,
  image: null,
};

function repository(
  refreshAccessToken: IdentityRepository["refreshAccessToken"],
  me: IdentityRepository["me"],
): IdentityRepository {
  return {
    refreshAccessToken,
    me,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    editProfile: vi.fn(),
  };
}

describe("identity media auth port", () => {
  it("returns the current in-memory token and refreshes user plus token together", async () => {
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "old-token",
      user,
    });
    const port = createIdentityMediaAuthPort(
      store,
      repository(
        vi.fn(async () => ({ ok: true as const, value: "new-token" })),
        vi.fn(async () => ({ ok: true as const, value: { ...user, name: "Updated" } })),
      ),
    );
    expect(port.getAccessToken()).toBe("old-token");
    await expect(port.refreshAccessToken()).resolves.toBe("new-token");
    expect(store.get(accessTokenAtom)).toBe("new-token");
  });

  it("clears the session when refresh fails", async () => {
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "old", user });
    const port = createIdentityMediaAuthPort(
      store,
      repository(
        vi.fn(async () => ({
          ok: false as const,
          code: "UNAUTHORIZED" as const,
          message: "expired",
        })),
        vi.fn(),
      ),
    );
    await expect(port.refreshAccessToken()).resolves.toBeNull();
    expect(store.get(accessTokenAtom)).toBeNull();
  });

  it("clears the session when the refreshed profile is invalid", async () => {
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "old", user });
    const port = createIdentityMediaAuthPort(
      store,
      repository(
        vi.fn(async () => ({ ok: true as const, value: "new" })),
        vi.fn(async () => ({ ok: false as const, code: "UNKNOWN" as const, message: "bad me" })),
      ),
    );
    await expect(port.refreshAccessToken()).resolves.toBeNull();
    expect(store.get(accessTokenAtom)).toBeNull();
  });
});
