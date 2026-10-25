import { message as localizedMessage, resolveMessage } from "../../../shared/i18n";
import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const acceptedTypes = new Set<string>(ACCEPTED_IMAGE_TYPES);

export const imageFileSchema = z
  .custom<File>((value) => value instanceof File, {
    message: localizedMessage("media.required"),
  })
  .superRefine((file, context) => {
    if (file.size > MAX_IMAGE_BYTES) {
      context.addIssue({
        code: "custom",
        message: localizedMessage("media.tooLarge"),
      });
    }

    if (!acceptedTypes.has(file.type)) {
      context.addIssue({
        code: "custom",
        message: localizedMessage("media.invalidType"),
      });
    }
  });

export function validateImageFile(
  file: File,
  resolve: (value: string) => string = resolveMessage,
): string | null {
  const result = imageFileSchema.safeParse(file);
  return result.success
    ? null
    : resolve(result.error.issues[0]?.message ?? localizedMessage("media.invalidImage"));
}
