import { describe, expect, it } from "vitest";

import { parseSignupRole } from "./access-policy";
import { loginSchema, profileSchema, signupSchema } from "./schemas";

describe("identity schemas", () => {
  it.each(["CUSTOMER", "OWNER", "COURIER"] as const)("accepts the %s role", (role) => {
    expect(
      signupSchema.safeParse({
        name: " Alex ",
        email: " ALEX@EXAMPLE.TEST ",
        password: "12345678",
        role,
        demoAcknowledged: true,
      }).success,
    ).toBe(true);
  });

  it("does not default an absent or invalid role", () => {
    expect(parseSignupRole(undefined)).toBeNull();
    expect(parseSignupRole("ADMIN")).toBeNull();
  });

  it("enforces password boundaries and normalizes login email", () => {
    expect(
      signupSchema.safeParse({
        name: "Alex",
        email: "alex@example.test",
        password: "1234567",
        role: "CUSTOMER",
        demoAcknowledged: true,
      }).success,
    ).toBe(false);
    expect(loginSchema.parse({ email: " ALEX@EXAMPLE.TEST ", password: "x" }).email).toBe(
      "alex@example.test",
    );
  });

  it("accepts nullable profile fields and an empty optional password", () => {
    expect(
      profileSchema.parse({
        name: "Alex",
        email: "alex@example.test",
        address: "",
        image: null,
        password: "",
      }),
    ).toMatchObject({ address: null, image: null, password: "" });
  });
});
