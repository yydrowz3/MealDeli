import { errorMessage, useI18n } from "../../../shared/i18n";
import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";

import type { Dish } from "../../catalog";
import { ImageField } from "../../media";
import type { MediaUploader, UploadProgress } from "../../media";
import { Button, Card, Input, Textarea } from "../../../shared/ui";
import { createDishFormOptions } from "../forms/form-options";
import {
  createEmptyDishChoice,
  createEmptyDishOption,
  createUiKeyFactory,
  toDishWriteDraft,
} from "../model/dish-form-schema";
import type { OwnerCommandResult, OwnerRestaurant } from "../model/types";
import { firstFieldError } from "./form-utils";

export type DishFormProps = Readonly<{
  dish?: Dish;
  uploader?: MediaUploader;
  onCancel: () => void;
  onSubmit: (
    draft: ReturnType<typeof toDishWriteDraft>,
  ) => Promise<OwnerCommandResult<OwnerRestaurant>>;
  onSuccess: (restaurant: OwnerRestaurant) => void;
}>;

export function DishForm({ dish, uploader, onCancel, onSubmit, onSuccess }: DishFormProps) {
  const { t, text } = useI18n();
  const createKey = useRef(createUiKeyFactory()).current;
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removedExistingOption, setRemovedExistingOption] = useState(false);
  const form = useForm({
    ...createDishFormOptions(dish, createKey),
    onSubmit: async ({ value }) => {
      setFormError(null);
      const result = await onSubmit(toDishWriteDraft(value));
      if (!result.ok) {
        setFormError(errorMessage(result.message, "owner.saveDishFailed"));
        return;
      }
      onSuccess(result.value);
    },
  });

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
            label={t("owner.dishName")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <Textarea
            error={text(firstFieldError(field.state.meta.errors))}
            label={t("owner.description")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="price">
        {(field) => (
          <Input
            error={text(firstFieldError(field.state.meta.errors))}
            inputMode="decimal"
            label={t("owner.priceUsd")}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="0.00"
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="image">
        {(field) => (
          <ImageField
            label={t("owner.dishImage")}
            onChange={(url) => field.handleChange(url)}
            onProgressChange={(progress: UploadProgress) =>
              setUploading(progress.status === "uploading")
            }
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>

      <section className="grid gap-4" aria-labelledby="dish-options-title">
        <div className="flex items-center justify-between gap-4">
          <h3 id="dish-options-title">{t("common.options")}</h3>
          <form.Field name="options" mode="array">
            {(optionsField) => (
              <Button
                onClick={() => optionsField.pushValue(createEmptyDishOption(createKey))}
                size="sm"
                type="button"
                variant="secondary"
              >
                {t("owner.addOption")}
              </Button>
            )}
          </form.Field>
        </div>
        {removedExistingOption ? (
          <p className="text-warning-text" role="status">
            {t("owner.savedOptionsHelp")}
          </p>
        ) : null}
        <form.Field name="options" mode="array">
          {(optionsField) =>
            optionsField.state.value.map((option, optionIndex) => (
              <Card className="grid gap-4" key={option.uiKey}>
                <form.Field name={`options[${optionIndex}].name`}>
                  {(field) => (
                    <Input
                      error={text(firstFieldError(field.state.meta.errors))}
                      label={t("owner.optionName")}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3 [@media(max-width:47.99rem)]:grid-cols-[1fr]">
                  <form.Field name={`options[${optionIndex}].minSelections`}>
                    {(field) => (
                      <Input
                        error={text(firstFieldError(field.state.meta.errors))}
                        label={t("owner.minSelections")}
                        min={0}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.valueAsNumber)}
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  </form.Field>
                  <form.Field name={`options[${optionIndex}].maxSelections`}>
                    {(field) => (
                      <Input
                        error={text(firstFieldError(field.state.meta.errors))}
                        label={t("owner.maxSelections")}
                        min={1}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.valueAsNumber)}
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  </form.Field>
                </div>
                <form.Field name={`options[${optionIndex}].choices`} mode="array">
                  {(choicesField) => (
                    <div className="grid gap-4">
                      {choicesField.state.value.map((choice, choiceIndex) => (
                        <div
                          className="grid grid-cols-2 [align-items:end] gap-3 border-t border-solid border-t-border pt-3 [@media(max-width:47.99rem)]:grid-cols-[1fr]"
                          key={choice.uiKey}
                        >
                          <form.Field name={`options[${optionIndex}].choices[${choiceIndex}].name`}>
                            {(field) => (
                              <Input
                                error={text(firstFieldError(field.state.meta.errors))}
                                label={t("owner.choiceName")}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                              />
                            )}
                          </form.Field>
                          <form.Field
                            name={`options[${optionIndex}].choices[${choiceIndex}].extraPrice`}
                          >
                            {(field) => (
                              <Input
                                error={text(firstFieldError(field.state.meta.errors))}
                                inputMode="decimal"
                                label={t("owner.extraPrice")}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                              />
                            )}
                          </form.Field>
                          <Button
                            disabled={choicesField.state.value.length === 1}
                            onClick={() => choicesField.removeValue(choiceIndex)}
                            size="sm"
                            type="button"
                            variant="tertiary"
                          >
                            {t("owner.removeChoice")}
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => choicesField.pushValue(createEmptyDishChoice(createKey))}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        {t("owner.addChoice")}
                      </Button>
                    </div>
                  )}
                </form.Field>
                <Button
                  onClick={() => {
                    if (option.id) setRemovedExistingOption(true);
                    optionsField.removeValue(optionIndex);
                  }}
                  size="sm"
                  type="button"
                  variant="danger"
                >
                  {t("owner.removeOption")}
                </Button>
              </Card>
            ))
          }
        </form.Field>
      </section>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onCancel} type="button" variant="secondary">
          {t("common.cancel")}
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || uploading} loading={isSubmitting} type="submit">
              {text(dish ? t("common.saveChanges") : t("owner.addDish"))}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
