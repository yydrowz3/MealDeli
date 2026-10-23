import { describe, expect, it } from "vitest";
import { accessPolicy, getRoleDefaultPath, sanitizeReturnTo } from "./access-policy";
import type { AccessPolicyInput, UserRole } from "./access-policy";

const base: AccessPolicyInput = {
  sessionStatus: "authenticated",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  role: "CUSTOMER",
  route: { requiresAuth: true, requiresVerification: true },
  pathname: "/restaurants",
};

describe("accessPolicy", () => {
  it("keeps private content hidden while the session is checking", () => {
    expect(accessPolicy({ ...base, sessionStatus: "checking" })).toEqual({ kind: "checking" });
  });

  it("allows a public route while a session check is in progress", () => {
    expect(accessPolicy({ ...base, sessionStatus: "checking", route: {} })).toEqual({
      kind: "allow",
    });
  });

  it("sends a guest to login with an encoded internal return target", () => {
    expect(
      accessPolicy({
        ...base,
        sessionStatus: "guest",
        role: null,
        pathname: "/orders",
        search: "?tab=past",
      }),
    ).toEqual({
      kind: "redirect",
      to: "/login?returnTo=%2Forders%3Ftab%3Dpast",
      reason: "login",
    });
  });

  it("requires verification before evaluating the role", () => {
    expect(
      accessPolicy({
        ...base,
        verifiedAt: null,
        role: "COURIER",
        route: { requiresVerification: true, allowedRoles: ["OWNER"] },
      }),
    ).toEqual({
      kind: "redirect",
      to: "/verify-email",
      reason: "verify",
    });
  });

  it.each<[UserRole, string]>([
    ["CUSTOMER", "/restaurants"],
    ["OWNER", "/dashboard"],
    ["COURIER", "/dashboard"],
  ])("routes a denied %s to its default path", (role, destination) => {
    expect(
      accessPolicy({
        ...base,
        role,
        route: { allowedRoles: [role === "OWNER" ? "CUSTOMER" : "OWNER"] },
      }),
    ).toEqual({
      kind: "redirect",
      to: destination,
      reason: "role",
    });
    expect(getRoleDefaultPath(role)).toBe(destination);
  });

  it.each<UserRole>(["CUSTOMER", "OWNER", "COURIER"])("allows the permitted %s role", (role) => {
    expect(accessPolicy({ ...base, role, route: { allowedRoles: [role] } })).toEqual({
      kind: "allow",
    });
  });
});

describe("sanitizeReturnTo", () => {
  const origin = "https://mealdeli.test";

  it.each([
    ["/restaurants/abc/menu?view=compact", "/restaurants/abc/menu?view=compact"],
    ["/orders/123", "/orders/123"],
    ["https://mealdeli.test/profile", "/profile"],
  ])("accepts a known same-origin target", (input, expected) => {
    expect(sanitizeReturnTo(input, origin)).toBe(expected);
  });

  it.each(["https://evil.test/orders", "//evil.test/orders", "/unknown", "/orders\\evil"])(
    "rejects unsafe returnTo %s",
    (input) => {
      expect(sanitizeReturnTo(input, origin)).toBeNull();
    },
  );
});
