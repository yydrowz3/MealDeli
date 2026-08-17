import { describe, expect, it } from "vitest";

import {
  canRoleAccessPath,
  getRoleHome,
  getSafeReturnTo,
  getVerificationGate,
  parseSignupRole,
} from "./access-policy";
import { buildSessionUser } from "../testing/fixtures";

describe("identity access policy", () => {
  it("maps all three roles to their workspace", () => {
    expect(getRoleHome("CUSTOMER")).toBe("/restaurants");
    expect(getRoleHome("OWNER")).toBe("/dashboard");
    expect(getRoleHome("COURIER")).toBe("/dashboard");
  });

  it("allows only safe, role-compatible internal return targets", () => {
    expect(getSafeReturnTo("/checkout?step=review", "CUSTOMER")).toBe("/checkout?step=review");
    expect(getSafeReturnTo("/checkout", "OWNER")).toBeNull();
    expect(getSafeReturnTo("/restaurants/shop/settings", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo("/restaurants/shop/settings", "OWNER")).toBe(
      "/restaurants/shop/settings",
    );
    expect(getSafeReturnTo("//evil.example/path", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo("https://evil.example", "CUSTOMER")).toBeNull();
  });

  it("gates authenticated but unverified sessions", () => {
    expect(getVerificationGate(buildSessionUser({ verifiedAt: null }), "authenticated")).toBe(
      "verify",
    );
    expect(getVerificationGate(buildSessionUser(), "authenticated")).toBe("allow");
  });

  it("parses only the three supported signup roles", () => {
    expect(parseSignupRole("CUSTOMER")).toBe("CUSTOMER");
    expect(parseSignupRole("OWNER")).toBe("OWNER");
    expect(parseSignupRole("COURIER")).toBe("COURIER");
    expect(parseSignupRole("ADMIN")).toBeNull();
    expect(parseSignupRole(undefined)).toBeNull();
  });

  it.each([
    ["CUSTOMER", "/", true],
    ["OWNER", "/profile", true],
    ["COURIER", "/orders/order-1", true],
    ["CUSTOMER", "/dashboard", false],
    ["OWNER", "/dashboard", true],
    ["COURIER", "/dashboard", true],
    ["CUSTOMER", "/checkout", true],
    ["OWNER", "/checkout", false],
    ["CUSTOMER", "/restaurants", true],
    ["OWNER", "/restaurants", true],
    ["COURIER", "/restaurants", false],
    ["OWNER", "/restaurants/new", true],
    ["CUSTOMER", "/restaurants/shop", true],
    ["OWNER", "/restaurants/shop", true],
    ["OWNER", "/restaurants/shop/menu", true],
    ["OWNER", "/restaurants/shop/settings", true],
    ["OWNER", "/restaurants/shop/promotion", true],
    ["CUSTOMER", "/restaurants/shop/menu", false],
    ["COURIER", "/deliveries/order-1", true],
    ["OWNER", "/deliveries/order-1", false],
    ["CUSTOMER", "/unknown", false],
    ["OWNER", "/restaurants/a/b/c", false],
  ] as const)("checks %s access to %s", (role, path, allowed) => {
    expect(canRoleAccessPath(role, path)).toBe(allowed);
  });

  it("rejects malformed, public, credentialed, and cross-role return targets", () => {
    expect(getSafeReturnTo("/login", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo("mailto:test@example.com", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo("https://user:pass@mealdeli.invalid/orders", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo("%", "CUSTOMER")).toBeNull();
    expect(getSafeReturnTo(null, "CUSTOMER")).toBeNull();
  });

  it("distinguishes checking, login, verification, and allowed gates", () => {
    expect(getVerificationGate(null, "idle")).toBe("checking");
    expect(getVerificationGate(null, "checking")).toBe("checking");
    expect(getVerificationGate(null, "anonymous")).toBe("login");
    expect(getVerificationGate(null, "expired")).toBe("login");
  });
});
