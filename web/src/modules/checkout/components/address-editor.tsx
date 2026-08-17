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
        setRequestError("Your session expired. Please log in again.");
        return;
      }
      const { address } = checkoutAddressSchema.parse(value);
      const result = await repository.editProfile(accessToken, {
        name: user.name,
        address,
        image: user.image,
      });
      if (!result.ok) {
        setRequestError("We couldn’t save your address. Try again.");
        return;
      }
      const refreshed = await repository.me(accessToken);
      if (!refreshed.ok) {
        setRequestError("We couldn’t refresh your profile. Try again.");
        return;
      }
      store.set(setSessionUserAtom, refreshed.value);
      onSaved(address);
    },
  });

  return (
    <form
      className="checkout-address-form"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {requestError ? <p role="alert">{requestError}</p> : null}
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={errorText(field.state.meta.errors)}
            label="Delivery address"
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
          <Button disabled={!canSubmit} loading={isSubmitting} type="submit">Save address</Button>
        )}
      </form.Subscribe>
    </form>
  );
}
