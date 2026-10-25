import { message as localizedMessage, validationMessage } from "../../../shared/i18n";
export function firstFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") return validationMessage(error);
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") return validationMessage(message);
    }
  }
  return undefined;
}

export function identityErrorMessage(
  code: string,
  fallback = localizedMessage("common.genericError"),
): string {
  if (code === "INVALID_CREDENTIALS") return localizedMessage("identity.invalidCredentials");
  if (code === "DUPLICATE_EMAIL") return localizedMessage("identity.duplicateEmail");
  if (code === "NETWORK") return fallback;
  return localizedMessage("common.genericError");
}
