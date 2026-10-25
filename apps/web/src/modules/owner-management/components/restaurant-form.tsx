import { errorMessage, message as localizedMessage, useI18n } from "../../../shared/i18n";
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
  submitLabel = localizedMessage("owner.createRestaurant"),
  onCancel,
  onSubmit,
  onSuccess,
}: RestaurantFormProps) {
  const { t, text } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm({
    ...createRestaurantFormOptions(defaultValues),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const draft = restaurantDraftSchema.parse(value);
      const result = await onSubmit(draft);
      if (!result.ok) {
        setFormError(errorMessage(result.message, "owner.createFailed"));
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
      className="grid gap-[var(--space-5)]"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {formError ? <p role="alert">{text(formError)}</p> : null}
      <form.Field name="name">
        {(field) => (
          <Input
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("owner.restaurantName")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="categoryId">
        {(field) => (
          <Select
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("common.category")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          >
            <option value="">{t("owner.chooseCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {text(category.name)}
              </option>
            ))}
          </Select>
        )}
      </form.Field>
      <form.Field name="address">
        {(field) => (
          <Textarea
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("common.address")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="image">
        {(field) => (
          <ImageField
            label={t("owner.restaurantImage")}
            onChange={(url) => field.handleChange(url)}
            onProgressChange={handleProgress}
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>
      <div className="flex flex-wrap gap-3">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="secondary">
            {t("common.cancel")}
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
              {text(submitLabel)}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
