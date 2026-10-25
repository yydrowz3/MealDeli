import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useForm } from "@tanstack/react-form";
import { useStore } from "jotai";
import { useState } from "react";

import { Button, Input, PasswordInput } from "../../../shared/ui";
import { createLoginFormOptions } from "../forms/form-options";
import { getRoleHome, getSafeReturnTo } from "../model/access-policy";
import { loginSchema } from "../model/schemas";
import { setAuthenticatedAtom } from "../model/session-atoms";
import type { JotaiStore } from "../model/session-atoms";
import type { IdentityRepository } from "../model/types";
import { firstFieldError, identityErrorMessage } from "./form-utils";

export type LoginFormProps = {
  repository: IdentityRepository;
  navigate: (to: string) => void;
  returnTo?: string | null;
  store?: JotaiStore;
};

export function LoginForm({
  repository,
  navigate,
  returnTo,
  store: injectedStore,
}: LoginFormProps) {
  const { t, text } = useI18n();
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    ...createLoginFormOptions(),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const parsed = loginSchema.parse(value);
      const signIn = await repository.signIn(parsed);
      if (!signIn.ok) {
        setFormError(identityErrorMessage(signIn.code, localizedMessage("identity.loginFailed")));
        return;
      }
      const me = await repository.me(signIn.value);
      if (!me.ok) {
        setFormError(localizedMessage("identity.loginFailed"));
        return;
      }
      store.set(setAuthenticatedAtom, { accessToken: signIn.value, user: me.value });
      if (!me.value.verifiedAt) return;
      navigate(getSafeReturnTo(returnTo, me.value.role) ?? getRoleHome(me.value.role));
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
            autoComplete="current-password"
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("identity.password")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            {t("common.logIn")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
