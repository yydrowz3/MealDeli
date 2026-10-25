import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { Button, Input, PasswordInput, Select } from "../../../shared/ui";
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
  const { t, text } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    ...createSignupFormOptions(role),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const { demoAcknowledged: _demoAcknowledged, ...signUpInput } = signupSchema.parse(value);
      const result = await repository.signUp(signUpInput);
      if (!result.ok) {
        setFormError(identityErrorMessage(result.code, localizedMessage("identity.signupFailed")));
        form.setFieldValue("password", "");
        return;
      }
      form.setFieldValue("password", "");
      onSuccess(signUpInput.email);
    },
  });

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {formError ? (
        <p className="text-danger-dark" role="alert">
          {text(formError)}
        </p>
      ) : null}
      {!role ? (
        <form.Field name="role">
          {(field) => (
            <Select
              error={text(firstFieldError(field.state.meta.errors))}
              label={t("identity.chooseRoleQuestion")}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value as UserRole | "")}
              value={field.state.value}
            >
              <option value="">{t("identity.chooseRole")}</option>
              <option value="CUSTOMER">{t("identity.customer")}</option>
              <option value="OWNER">{t("identity.owner")}</option>
              <option value="COURIER">{t("identity.courier")}</option>
            </Select>
          )}
        </form.Field>
      ) : null}
      <form.Field name="name">
        {(field) => (
          <Input
            autoComplete="name"
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("identity.fullName")}
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
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("identity.email")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            type="email"
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <PasswordInput
            autoComplete="new-password"
            description={t("identity.passwordHint")}
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("identity.password")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="demoAcknowledged">
        {(field) => {
          const error = firstFieldError(field.state.meta.errors);
          return (
            <div>
              <label className="grid grid-cols-[auto_1fr] items-start gap-2">
                <input
                  aria-describedby={error ? "demo-acknowledged-error" : undefined}
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.checked)}
                  type="checkbox"
                />
                <span>{t("identity.demoAcknowledgement")}</span>
              </label>
              {error ? (
                <span
                  className="ml-7 block text-small text-danger-dark"
                  id="demo-acknowledged-error"
                >
                  {text(error)}
                </span>
              ) : null}
            </div>
          );
        }}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            {t("identity.createAccount")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
