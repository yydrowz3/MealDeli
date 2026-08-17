import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { Button, Input, Select } from "../../../shared/ui";
import { createSignupFormOptions } from "../forms/form-options";
import { signupSchema } from "../model/schemas";
import type { IdentityRepository, UserRole } from "../model/types";
import { firstFieldError, identityErrorMessage } from "./form-utils";

export type SignupFormProps = {
  repository: IdentityRepository;
  role: UserRole | null;
  onSuccess: (email: string) => void;
};

export function SignupForm({ repository, role, onSuccess }: SignupFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    ...createSignupFormOptions(role),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const parsed = signupSchema.parse(value);
      const result = await repository.signUp(parsed);
      if (!result.ok) {
        setFormError(
          identityErrorMessage(result.code, "We couldn’t create your account. Try again."),
        );
        form.setFieldValue("password", "");
        return;
      }
      form.setFieldValue("password", "");
      onSuccess(parsed.email);
    },
  });

  return (
    <form
      className="identity-form"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {formError ? (
        <p className="identity-form__error" role="alert">
          {formError}
        </p>
      ) : null}
      {!role ? (
        <form.Field name="role">
          {(field) => (
            <Select
              error={firstFieldError(field.state.meta.errors)}
              label="How do you want to use MealDeli?"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value as UserRole | "")}
              value={field.state.value}
            >
              <option value="">Choose a role</option>
              <option value="CUSTOMER">Customer</option>
              <option value="OWNER">Owner</option>
              <option value="COURIER">Courier</option>
            </Select>
          )}
        </form.Field>
      ) : null}
      <form.Field name="name">
        {(field) => (
          <Input
            autoComplete="name"
            error={firstFieldError(field.state.meta.errors)}
            label="Full name"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
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
      <form.Field name="password">
        {(field) => (
          <Input
            autoComplete="new-password"
            description="At least 8 characters"
            error={firstFieldError(field.state.meta.errors)}
            label="Password"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            type={showPassword ? "text" : "password"}
            value={field.state.value}
          />
        )}
      </form.Field>
      <Button onClick={() => setShowPassword((value) => !value)} type="button" variant="tertiary">
        {showPassword ? "Hide password" : "Show password"}
      </Button>
      <form.Field name="demoAcknowledged">
        {(field) => {
          const error = firstFieldError(field.state.meta.errors);
          return (
            <div className="identity-checkbox-field">
              <label className="identity-checkbox">
                <input
                  aria-describedby={error ? "demo-acknowledged-error" : undefined}
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.checked)}
                  type="checkbox"
                />
                <span>I understand this is a MealDeli demo account.</span>
              </label>
              {error ? (
                <span className="identity-field-error" id="demo-acknowledged-error">
                  {error}
                </span>
              ) : null}
            </div>
          );
        }}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            Create account
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
