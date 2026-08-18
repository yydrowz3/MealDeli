import { describe, expect, it } from "vitest";

import { checkoutAddressSchema } from "./checkout-form-options";

describe("checkoutAddressSchema", () => {
  it("trims and accepts only 1–500 characters", () => {
    expect(checkoutAddressSchema.parse({ address: "  10 Main Street  " })).toEqual({
      address: "10 Main Street",
    });
    expect(checkoutAddressSchema.safeParse({ address: " " }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ address: "a".repeat(500) }).success).toBe(true);
    expect(checkoutAddressSchema.safeParse({ address: "a".repeat(501) }).success).toBe(false);
  });
});
