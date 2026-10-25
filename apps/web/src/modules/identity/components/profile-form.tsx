import { message as localizedMessage, useI18n } from "../../../shared/i18n";
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

const roleLabels = {
  CUSTOMER: localizedMessage("identity.customer"),
  OWNER: localizedMessage("identity.owner"),
  COURIER: localizedMessage("identity.courier"),
} as const;

export function ProfileForm({
  repository,
  uploader,
  store: injectedStore,
  onVerificationRequired,
}: ProfileFormProps) {
  const { t, text } = useI18n();
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
        setFormError(localizedMessage("common.sessionExpired"));
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
        setFormError(identityErrorMessage(result.code, localizedMessage("common.saveFailed")));
        return;
      }
      const refreshed = await repository.me(accessToken);
      if (!refreshed.ok) {
        setFormError(localizedMessage("common.refreshProfileFailed"));
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
      setStatus(localizedMessage("identity.profileUpdated"));
      if (emailChanged || !refreshed.value.verifiedAt) onVerificationRequired?.();
    },
  });

  if (!user) return <p>{t("common.sessionExpired")}</p>;

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
      <form.Field name="image">
        {(field) => (
          <ImageField
            label={t("identity.avatar")}
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
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("common.address")}
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
            description={t("identity.keepPassword")}
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("identity.newPassword")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            type="password"
            value={field.state.value}
          />
        )}
      </form.Field>
      <Input disabled label={t("identity.role")} readOnly value={text(roleLabels[user.role])} />
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button disabled={!canSubmit} loading={isSubmitting} size="lg" type="submit">
            {t("common.saveChanges")}
          </Button>
        )}
      </form.Subscribe>
      {status ? <p aria-live="polite">{text(status)}</p> : null}
    </form>
  );
}
