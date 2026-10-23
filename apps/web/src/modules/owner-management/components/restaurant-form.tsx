import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import type { CategorySummary } from "../../catalog";
import { ImageField } from "../../media";
import type { MediaUploader, UploadProgress } from "../../media";
import { Button, Input, Select, Textarea } from "../../../shared/ui";
import { createRestaurantFormOptions } from "../forms/form-options";
import { restaurantDraftSchema, type RestaurantFormValues } from "../model/restaurant-form-schema";
import type { OwnerCommandResult, OwnerRestaurant, RestaurantDraft } from "../model/types";
import { firstFieldError } from "./form-utils";

export type RestaurantFormProps = Readonly<{
  categories: readonly CategorySummary[];
  uploader?: MediaUploader;
  defaultValues?: Partial<RestaurantFormValues>;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (draft: RestaurantDraft) => Promise<OwnerCommandResult<OwnerRestaurant>>;
  onSuccess?: (restaurant: OwnerRestaurant) => void;
}>;

export function RestaurantForm({
  categories,
  uploader,
  defaultValues,
  submitLabel = "Create restaurant",
  onCancel,
  onSubmit,
  onSuccess,
}: RestaurantFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm({
    ...createRestaurantFormOptions(defaultValues),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const draft = restaurantDraftSchema.parse(value);
      const result = await onSubmit(draft);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      form.reset({
        name: result.value.name,
        categoryId: result.value.category.id,
        address: result.value.address,
        image: result.value.image,
      });
      onSuccess?.(result.value);
    },
  });

  const handleProgress = (progress: UploadProgress) => {
    setUploading(progress.status === "uploading");
  };

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
      <form.Field name="categoryId">
        {(field) => (
          <Select
            error={firstFieldError(field.state.meta.errors)}
            label="Category"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
      </form.Field>
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
            onProgressChange={handleProgress}
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>
      <div className="owner-form__actions">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        ) : null}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              disabled={!canSubmit || uploading}
              loading={isSubmitting}
              size="lg"
              type="submit"
            >
              {submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
