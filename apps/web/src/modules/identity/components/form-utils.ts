export function firstFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}

export function identityErrorMessage(
  code: string,
  fallback = "Something went wrong. Try again.",
): string {
  if (code === "INVALID_CREDENTIALS") return "Incorrect email or password.";
  if (code === "DUPLICATE_EMAIL") return "An account with this email already exists.";
  if (code === "NETWORK") return fallback;
  return "Something went wrong. Try again.";
}
