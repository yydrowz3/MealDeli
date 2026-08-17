import { useForm } from "@tanstack/react-form";
import { useAtomValue, useStore } from "jotai";
import { useState } from "react";

import { ImageField } from "../../media";
import type { MediaUploader } from "../../media";
import { Button, Input, Textarea } from "../../../shared/ui";
import { createProfileFormOptions } from "../forms/form-options";
import { profileSchema } from "../model/schemas";
import { accessTokenAtom, sessionUserAtom, setSessionUserAtom } from "../model/session-atoms";
import type { JotaiStore } from "../model/session-atoms";
import type { IdentityRepository } from "../model/types";
import { firstFieldError, identityErrorMessage } from "./form-utils";

export type ProfileFormProps = {
  repository: IdentityRepository;
  uploader?: MediaUploader;
  store?: JotaiStore;
  onVerificationRequired?: () => void;
};

const roleLabels = { CUSTOMER: "Customer", OWNER: "Owner", COURIER: "Courier" } as const;

export function ProfileForm({
  repository,
  uploader,
  store: injectedStore,
  onVerificationRequired,
}: ProfileFormProps) {
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const user = useAtomValue(sessionUserAtom, { store });
  const accessToken = useAtomValue(accessTokenAtom, { store });
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const form = useForm({
    ...createProfileFormOptions(user ?? undefined),
    onSubmit: async ({ value }) => {
      setFormError(null);
      setStatus(null);
      if (!accessToken || !user) {
        setFormError("Your session expired. Please log in again.");
        return;
      }
      const parsed = profileSchema.parse(value);
      const emailChanged = parsed.email !== user.email.toLowerCase();
      const result = await repository.editProfile(accessToken, {
        name: parsed.name,
        ...(emailChanged ? { email: parsed.email } : {}),
        address: parsed.address,
        image: parsed.image,
        ...(parsed.password ? { password: parsed.password } : {}),
      });
      if (!result.ok) {
        setFormError(
          identityErrorMessage(result.code, "We couldn’t save your changes. Try again."),
        );
        return;
      }
      const refreshed = await repository.me(accessToken);
      if (!refreshed.ok) {
        setFormError("We couldn’t refresh your profile. Try again.");
        return;
      }
      store.set(setSessionUserAtom, refreshed.value);
      form.reset({
        name: refreshed.value.name,
        email: refreshed.value.email,
        address: refreshed.value.address ?? "",
        image: refreshed.value.image,
        password: "",
      });
      setStatus("Profile updated.");
      if (emailChanged || !refreshed.value.verifiedAt) onVerificationRequired?.();
    },
  });

  if (!user) return <p>Your session expired. Please log in again.</p>;

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
      <form.Field name="image">
        {(field) => (
          <ImageField
            label="Avatar"
            onChange={(url) => field.handleChange(url)}
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>
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
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={firstFieldError(field.state.meta.errors)}
            label="Address"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value ?? "")}
            value={field.state.value ?? ""}
          />
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <Input
            autoComplete="new-password"
            description="Leave blank to keep your current password."
            error={firstFieldError(field.state.meta.errors)}
            label="New password"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            type="password"
            value={field.state.value}
          />
        )}
      </form.Field>
      <Input disabled label="Role" readOnly value={roleLabels[user.role]} />
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            Save changes
          </Button>
        )}
      </form.Subscribe>
      {status ? <p aria-live="polite">{status}</p> : null}
    </form>
  );
}
