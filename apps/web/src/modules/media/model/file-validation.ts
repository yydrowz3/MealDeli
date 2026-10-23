import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const acceptedTypes = new Set<string>(ACCEPTED_IMAGE_TYPES);

export const imageFileSchema = z
  .custom<File>((value) => value instanceof File, {
    message: "Choose an image file.",
  })
  .superRefine((file, context) => {
    if (file.size > MAX_IMAGE_BYTES) {
      context.addIssue({
        code: "custom",
        message: "Image must be 5 MB or smaller.",
      });
    }

    if (!acceptedTypes.has(file.type)) {
      context.addIssue({
        code: "custom",
        message: "Choose a JPEG, PNG, or WebP image.",
      });
    }
  });

export function validateImageFile(file: File): string | null {
  const result = imageFileSchema.safeParse(file);
  return result.success ? null : (result.error.issues[0]?.message ?? "Choose a valid image.");
}
