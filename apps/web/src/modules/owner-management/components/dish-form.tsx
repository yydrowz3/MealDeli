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
        setFormError(result.message);
        return;
      }
      onSuccess(result.value);
    },
  });

  return (
    <form
      className="owner-dish-form"
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
            label="Dish name"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <Textarea
            error={firstFieldError(field.state.meta.errors)}
            label="Description"
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="price">
        {(field) => (
          <Input
            error={firstFieldError(field.state.meta.errors)}
            inputMode="decimal"
            label="Price (USD)"
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
            label="Dish image"
            onChange={(url) => field.handleChange(url)}
            onProgressChange={(progress: UploadProgress) =>
              setUploading(progress.status === "uploading")
            }
            uploader={uploader}
            value={field.state.value}
          />
        )}
      </form.Field>

      <section className="owner-option-builder" aria-labelledby="dish-options-title">
        <div className="owner-option-builder__heading">
          <h3 id="dish-options-title">Options</h3>
          <form.Field name="options" mode="array">
            {(optionsField) => (
              <Button
                onClick={() => optionsField.pushValue(createEmptyDishOption(createKey))}
                size="sm"
                type="button"
                variant="secondary"
              >
                Add option
              </Button>
            )}
          </form.Field>
        </div>
        {removedExistingOption ? (
          <p className="owner-option-builder__warning" role="status">
            Past orders keep their saved option snapshots and are not changed.
          </p>
        ) : null}
        <form.Field name="options" mode="array">
          {(optionsField) =>
            optionsField.state.value.map((option, optionIndex) => (
              <Card className="owner-option-builder__option" key={option.uiKey}>
                <form.Field name={`options[${optionIndex}].name`}>
                  {(field) => (
                    <Input
                      error={firstFieldError(field.state.meta.errors)}
                      label="Option name"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <div className="owner-option-builder__limits">
                  <form.Field name={`options[${optionIndex}].minSelections`}>
                    {(field) => (
                      <Input
                        error={firstFieldError(field.state.meta.errors)}
                        label="Minimum selections"
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
                        error={firstFieldError(field.state.meta.errors)}
                        label="Maximum selections"
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
                    <div className="owner-option-builder__choices">
                      {choicesField.state.value.map((choice, choiceIndex) => (
                        <div className="owner-option-builder__choice" key={choice.uiKey}>
                          <form.Field name={`options[${optionIndex}].choices[${choiceIndex}].name`}>
                            {(field) => (
                              <Input
                                error={firstFieldError(field.state.meta.errors)}
                                label="Choice name"
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
                                error={firstFieldError(field.state.meta.errors)}
                                inputMode="decimal"
                                label="Extra price (USD)"
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
                            Remove choice
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => choicesField.pushValue(createEmptyDishChoice(createKey))}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Add choice
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
                  Remove option
                </Button>
              </Card>
            ))
          }
        </form.Field>
      </section>
      <div className="owner-form__actions">
        <Button onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || uploading} loading={isSubmitting} type="submit">
              {dish ? "Save changes" : "Add dish"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
