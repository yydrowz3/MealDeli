import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useForm } from "@tanstack/react-form";
import { useAtomValue, useStore } from "jotai";
import { useState } from "react";

import {
  accessTokenAtom,
  sessionUserAtom,
  setSessionUserAtom,
  type IdentityRepository,
  type JotaiStore,
} from "../../identity";
import { Button, Textarea } from "../../../shared/ui";
import {
  checkoutAddressSchema,
  createCheckoutAddressFormOptions,
} from "../forms/checkout-form-options";

export type AddressEditorProps = {
  repository: IdentityRepository;
  onSaved: (address: string) => void;
  store?: JotaiStore;
};

function errorText(errors: readonly unknown[]): string | undefined {
  const error = errors[0];
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return undefined;
}

export function AddressEditor({ repository, onSaved, store: injectedStore }: AddressEditorProps) {
  const { t, text } = useI18n();
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const user = useAtomValue(sessionUserAtom, { store });
  const accessToken = useAtomValue(accessTokenAtom, { store });
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm({
    ...createCheckoutAddressFormOptions(user?.address ?? ""),
    onSubmit: async ({ value }) => {
      setRequestError(null);
      if (!user || !accessToken) {
        setRequestError(localizedMessage("common.sessionExpired"));
        return;
      }
      const { address } = checkoutAddressSchema.parse(value);
      const result = await repository.editProfile(accessToken, {
        name: user.name,
        address,
        image: user.image,
      });
      if (!result.ok) {
        setRequestError(localizedMessage("checkout.saveAddressFailed"));
        return;
      }
      const refreshed = await repository.me(accessToken);
      if (!refreshed.ok) {
        setRequestError(localizedMessage("common.refreshProfileFailed"));
        return;
      }
      store.set(setSessionUserAtom, refreshed.value);
      onSaved(address);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {requestError ? <p role="alert">{text(requestError)}</p> : null}
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={text(errorText(field.state.meta.errors))}
            label={t("common.deliveryAddress")}
            maxLength={500}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            rows={4}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button className="mt-4 mb-2" disabled={!canSubmit} loading={isSubmitting} type="submit">
            {t("checkout.saveAddress")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
