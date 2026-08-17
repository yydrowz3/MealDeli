import type { SessionUser, UserRole } from "./types";

const publicPaths = new Set(["/", "/login", "/signup", "/verify-email"]);

export function getRoleHome(role: UserRole): string {
  return role === "CUSTOMER" ? "/restaurants" : "/dashboard";
}

export function parseSignupRole(value: string | null | undefined): UserRole | null {
  return value === "CUSTOMER" || value === "OWNER" || value === "COURIER" ? value : null;
}

function normalizeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://mealdeli.invalid");
    if (url.origin !== "https://mealdeli.invalid") return null;
    if (url.username || url.password) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  if (publicPaths.has(pathname) || pathname === "/profile" || pathname === "/orders") return true;
  if (pathname.startsWith("/orders/")) return true;
  if (pathname === "/dashboard") return role === "OWNER" || role === "COURIER";
  if (pathname === "/checkout") return role === "CUSTOMER";
  if (pathname === "/restaurants") return role === "CUSTOMER" || role === "OWNER";
  if (pathname === "/restaurants/new") return role === "OWNER";
  if (pathname.startsWith("/restaurants/")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 2) return role === "CUSTOMER" || role === "OWNER";
    if (
      segments.length === 3 &&
      (segments[2] === "menu" || segments[2] === "settings" || segments[2] === "promotion")
    ) {
      return role === "OWNER";
    }
    return false;
  }
  if (pathname.startsWith("/deliveries/")) return role === "COURIER";
  return false;
}

export function getSafeReturnTo(value: string | null | undefined, role: UserRole): string | null {
  const normalized = normalizeReturnTo(value);
  if (!normalized) return null;
  const pathname = new URL(normalized, "https://mealdeli.invalid").pathname;
  if (publicPaths.has(pathname)) return null;
  return canRoleAccessPath(role, pathname) ? normalized : null;
}

export type VerificationGateResult = "allow" | "verify" | "login" | "checking";

export function getVerificationGate(
  user: SessionUser | null,
  status: string,
): VerificationGateResult {
  if (status === "idle" || status === "checking") return "checking";
  if (!user || status === "anonymous" || status === "expired") return "login";
  return user.verifiedAt ? "allow" : "verify";
}
