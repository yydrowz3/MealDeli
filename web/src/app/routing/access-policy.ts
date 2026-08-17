export type UserRole = "CUSTOMER" | "OWNER" | "COURIER";
export type SessionStatus = "checking" | "guest" | "authenticated";

export type RouteMetadata = {
  requiresAuth?: boolean;
  requiresVerification?: boolean;
  allowedRoles?: readonly UserRole[];
};

export type AccessDecision =
  | { kind: "checking" }
  | { kind: "allow" }
  | { kind: "redirect"; to: string; reason: "login" | "verify" | "role" };

export type AccessPolicyInput = {
  sessionStatus: SessionStatus;
  verifiedAt: string | null;
  role: UserRole | null;
  route: RouteMetadata;
  pathname: string;
  search?: string;
};

export function getRoleDefaultPath(role: UserRole | null) {
  return role === "CUSTOMER" ? "/restaurants" : role ? "/dashboard" : "/";
}

const knownPathPatterns = [
  /^\/$/,
  /^\/(?:login|signup|verify-email)\/?$/,
  /^\/dashboard\/?$/,
  /^\/restaurants\/?$/,
  /^\/restaurants\/new\/?$/,
  /^\/restaurants\/[^/]+\/?$/,
  /^\/restaurants\/[^/]+\/(?:menu|settings|promotion)\/?$/,
  /^\/checkout\/?$/,
  /^\/orders\/?$/,
  /^\/orders\/[^/]+\/?$/,
  /^\/deliveries\/[^/]+\/?$/,
  /^\/profile\/?$/,
];

export function sanitizeReturnTo(value: string | null | undefined, appOrigin: string) {
  if (!value || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const url = new URL(value, appOrigin);
    if (url.origin !== appOrigin || !knownPathPatterns.some((pattern) => pattern.test(url.pathname))) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function accessPolicy(input: AccessPolicyInput): AccessDecision {
  const requiresSession =
    input.route.requiresAuth === true ||
    input.route.requiresVerification === true ||
    Boolean(input.route.allowedRoles?.length);

  if (input.sessionStatus === "checking" && requiresSession) {
    return { kind: "checking" };
  }
  if (requiresSession && input.sessionStatus !== "authenticated") {
    const returnTo = encodeURIComponent(`${input.pathname}${input.search ?? ""}`);
    return { kind: "redirect", to: `/login?returnTo=${returnTo}`, reason: "login" };
  }
  if (input.route.requiresVerification && !input.verifiedAt) {
    return { kind: "redirect", to: "/verify-email", reason: "verify" };
  }
  if (input.route.allowedRoles?.length && (!input.role || !input.route.allowedRoles.includes(input.role))) {
    return { kind: "redirect", to: getRoleDefaultPath(input.role), reason: "role" };
  }
  return { kind: "allow" };
}
