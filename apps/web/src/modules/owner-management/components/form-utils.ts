import { validationMessage } from "../../../shared/i18n";

export function firstFieldError(errors: readonly unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") return validationMessage(error);
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") return validationMessage(message);
    }
  }
  return undefined;
}
