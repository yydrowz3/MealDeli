import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";

import { ImageField } from "../../media";
import type { MediaUploader, UploadProgress } from "../../media";
import { Button, Input, Textarea } from "../../../shared/ui";
import { createRestaurantSettingsFormOptions } from "../forms/form-options";
import { restaurantSettingsSchema } from "../model/restaurant-form-schema";
import type { OwnerCommandResult, OwnerRestaurant } from "../model/types";
import { firstFieldError } from "./form-utils";

export type RestaurantSettingsFormProps = Readonly<{
  restaurant: OwnerRestaurant;
  uploader?: MediaUploader;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (draft: {
    name: string;
    address: string;
    image: string | null;
  }) => Promise<OwnerCommandResult<OwnerRestaurant>>;
}>;

export function RestaurantSettingsForm({
  restaurant,
  uploader,
  onDirtyChange,
  onSubmit,
}: RestaurantSettingsFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm({
    ...createRestaurantSettingsFormOptions({
      name: restaurant.name,
      address: restaurant.address,
      image: restaurant.image,
    }),
    onSubmit: async ({ value }) => {
      setFormError(null);
      setStatus(null);
      const result = await onSubmit(restaurantSettingsSchema.parse(value));
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      form.reset({
        name: result.value.name,
        address: result.value.address,
        image: result.value.image,
      });
      setStatus("Restaurant updated.");
    },
  });

  useEffect(() => {
    const subscription = form.store.subscribe(() => onDirtyChange?.(form.state.isDirty));
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.state.isDirty) return;
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    return () => globalThis.removeEventListener("beforeunload", beforeUnload);
  }, [form]);

  return (
    <form
      className="owner-form"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {formError ? <p role="alert">{formError}</p> : null}
      <form.Field name="name">
        {(field) => (
          <Input
            error={firstFieldError(field.state.meta.errors)}
            label="Restaurant name"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <Input
        description="Category can’t be changed."
        disabled
        label="Category"
        readOnly
        value={restaurant.category.name}
      />
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={firstFieldError(field.state.meta.errors)}
            label="Address"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="image">
        {(field) => (
          <ImageField
            label="Restaurant image"
            onChange={(url) => field.handleChange(url)}
            onProgressChange={(progress: UploadProgress) =>
              setUploading(progress.status === "uploading")
            }
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isDirty, state.isSubmitting] as const}
      >
        {([canSubmit, isDirty, isSubmitting]) => (
          <Button
            disabled={!canSubmit || !isDirty || uploading}
            loading={isSubmitting}
            size="lg"
            type="submit"
          >
            Save changes
          </Button>
        )}
      </form.Subscribe>
      {status ? <p aria-live="polite">{status}</p> : null}
    </form>
  );
}
