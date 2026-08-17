import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";

import { Button, Input } from "../../../shared/ui";
import { createResendFormOptions } from "../forms/form-options";
import { resendSchema } from "../model/schemas";
import type { IdentityRepository } from "../model/types";
import { firstFieldError } from "./form-utils";

export type ResendFormProps = {
  repository: IdentityRepository;
  email?: string;
  cooldownSeconds?: number;
};

export function ResendForm({ repository, email = "", cooldownSeconds = 30 }: ResendFormProps) {
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const form = useForm({
    ...createResendFormOptions({ email }),
    onSubmit: async ({ value }) => {
      setStatus(null);
      const parsed = resendSchema.parse(value);
      const result = await repository.resendVerification(parsed.email);
      if (!result.ok) {
        setStatus("We couldn’t resend the email. Try again later.");
        return;
      }
      setStatus("Verification email sent.");
      setRemaining(cooldownSeconds);
    },
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return (
    <form
      className="identity-form identity-form--compact"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <Input
            autoComplete="email"
            error={firstFieldError(field.state.meta.errors)}
            label="Email address"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            type="email"
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button disabled={remaining > 0} loading={isSubmitting} type="submit" variant="secondary">
            {remaining > 0 ? `Resend email in ${remaining}s` : "Resend email"}
          </Button>
        )}
      </form.Subscribe>
      {status ? <p aria-live="polite">{status}</p> : null}
    </form>
  );
}
