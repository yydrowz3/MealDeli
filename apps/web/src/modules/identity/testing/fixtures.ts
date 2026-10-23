import { vi } from "vitest";

import type { IdentityRepository, SessionUser } from "../model/types";

export function buildSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "00000000-0000-7000-8000-000000000001",
    email: "alex@example.test",
    name: "Alex Example",
    role: "CUSTOMER",
    verifiedAt: "2026-08-17T08:00:00.000Z",
    address: null,
    image: null,
    ...overrides,
  };
}

export function createFakeIdentityRepository(
  overrides: Partial<IdentityRepository> = {},
): IdentityRepository {
  return {
    refreshAccessToken: vi.fn().mockResolvedValue({ ok: false, code: "UNAUTHORIZED", message: "" }),
    me: vi.fn().mockResolvedValue({ ok: true, value: buildSessionUser() }),
    signIn: vi.fn().mockResolvedValue({ ok: true, value: "access-token" }),
    signUp: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    signOut: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    verifyEmail: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    resendVerification: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    editProfile: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    ...overrides,
  };
}
