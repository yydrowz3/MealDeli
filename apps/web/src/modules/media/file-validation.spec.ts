import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES, validateImageFile } from "./model/file-validation";

describe("validateImageFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(validateImageFile(new File(["image"], "meal", { type }))).toBeNull();
  });

  it("rejects files larger than 5 MiB", () => {
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    expect(validateImageFile(file)).toBe("Image must be 5 MB or smaller.");
  });

  it("rejects unsupported declared MIME types", () => {
    expect(validateImageFile(new File(["image"], "meal.gif", { type: "image/gif" }))).toBe(
      "Choose a JPEG, PNG, or WebP image.",
    );
  });
});
