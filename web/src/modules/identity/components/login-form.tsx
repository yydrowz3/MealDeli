import { useForm } from "@tanstack/react-form";
import { useStore } from "jotai";
import { useState } from "react";

import { Button, Input } from "../../../shared/ui";
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
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    ...createLoginFormOptions(),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const parsed = loginSchema.parse(value);
      const signIn = await repository.signIn(parsed);
      if (!signIn.ok) {
        setFormError(
          identityErrorMessage(
            signIn.code,
            "We couldn’t log you in. Check your connection and try again.",
          ),
        );
        return;
      }
      const me = await repository.me(signIn.value);
      if (!me.ok) {
        setFormError("We couldn’t log you in. Check your connection and try again.");
        return;
      }
      store.set(setAuthenticatedAtom, { accessToken: signIn.value, user: me.value });
      if (!me.value.verifiedAt) return;
      navigate(getSafeReturnTo(returnTo, me.value.role) ?? getRoleHome(me.value.role));
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
            autoComplete="current-password"
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
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            Log in
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
