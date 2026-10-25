import { useI18n } from "../../../shared/i18n";
import { Trans } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { useRef } from "react";

import type { Dish } from "../../catalog";
import { Button, Money } from "../../../shared/ui";
import { createDishCustomizerFormOptions } from "../forms/dish-customizer-form-options";
import {
  createCartLineFromSelection,
  getDishSelectionTotalMinor,
  optionSelectionRule,
  type DishSelectionValues,
} from "../model/dish-selection";
import type { CartLine } from "../model/types";

export type DishCustomizerProps = {
  dish: Dish;
  onAdd: (line: CartLine) => void | Promise<void>;
  uuid?: () => string;
};

function selected(values: readonly string[], choiceId: string) {
  return values.includes(choiceId);
}

export function DishCustomizer({ dish, onAdd, uuid }: DishCustomizerProps) {
  const { t, text, i18n, language, formatNumber } = useI18n();
  const optionRefs = useRef(new Map<string, HTMLFieldSetElement>());
  const form = useForm({
    ...createDishCustomizerFormOptions(dish),
    onSubmitInvalid: ({ value }) => {
      const parsed = createDishCustomizerFormOptions(dish).validators?.onSubmit;
      const values = value as DishSelectionValues;
      if (!parsed) return;
      const firstInvalid = dish.options.find((option) => {
        const count =
          values.selections.find((item) => item.optionId === option.id)?.choiceIds.length ?? 0;
        return count < option.minSelections || count > option.maxSelections;
      });
      optionRefs.current.get(firstInvalid?.id ?? dish.options[0]?.id ?? "")?.focus();
    },
    onSubmit: async ({ value }) => {
      await onAdd(createCartLineFromSelection(dish, value, uuid));
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <header>
        <h2>{text(dish.name)}</h2>
        <p>{text(dish.description)}</p>
        <Money minor={dish.priceMinor} />
      </header>
      {dish.options.map((option, optionIndex) => (
        <form.Field key={option.id} mode="array" name={`selections[${optionIndex}].choiceIds`}>
          {(field) => {
            const values = field.state.value;
            const atLimit = values.length >= option.maxSelections;
            return (
              <fieldset
                className="m-0 grid gap-4 border-0 border-none p-0"
                ref={(node) => {
                  if (node) optionRefs.current.set(option.id, node);
                  else optionRefs.current.delete(option.id);
                }}
                tabIndex={-1}
              >
                <legend>{text(option.name)}</legend>
                <p>{text(optionSelectionRule(option.minSelections, option.maxSelections))}</p>
                {option.choices.map((choice) => {
                  const checked = selected(values, choice.id);
                  const single = option.maxSelections === 1;
                  return (
                    <label
                      className="flex items-center gap-3 [&>span:last-child]:ms-auto"
                      key={choice.id}
                    >
                      <input
                        checked={checked}
                        disabled={!checked && atLimit && !single}
                        name={`dish-${dish.id}-option-${option.id}`}
                        onChange={() => {
                          if (single) {
                            field.handleChange(checked ? [] : [choice.id]);
                          } else if (checked) {
                            field.handleChange(values.filter((id) => id !== choice.id));
                          } else if (!atLimit) {
                            field.handleChange([...values, choice.id]);
                          }
                        }}
                        type={single && option.minSelections > 0 ? "radio" : "checkbox"}
                      />
                      <span>{text(choice.name)}</span>
                      {choice.extraMinor > 0 ? (
                        <span>
                          +<Money minor={choice.extraMinor} />
                        </span>
                      ) : null}
                    </label>
                  );
                })}
                {field.state.meta.errors.length > 0 ? (
                  <p className="text-[var(--color-danger-dark)]" role="alert">
                    {text(optionSelectionRule(option.minSelections, option.maxSelections))}
                  </p>
                ) : null}
              </fieldset>
            );
          }}
        </form.Field>
      ))}
      <form.Field name="quantity">
        {(field) => (
          <div aria-label={t("common.quantity")} className="flex items-center gap-3" role="group">
            <Button
              aria-label={t("checkout.decreaseQuantity")}
              className="min-h-11! min-w-11"
              disabled={field.state.value <= 1}
              onClick={() => field.handleChange(field.state.value - 1)}
              variant="secondary"
            >
              −
            </Button>
            <span aria-live="polite">{formatNumber(field.state.value)}</span>
            <Button
              aria-label={t("checkout.increaseQuantity")}
              className="min-h-11! min-w-11"
              disabled={field.state.value >= 99}
              onClick={() => field.handleChange(field.state.value + 1)}
              variant="secondary"
            >
              +
            </Button>
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.values, state.isSubmitting] as const}>
        {([values, isSubmitting]) => (
          <Button loading={isSubmitting} size="lg" type="submit">
            <Trans
              key={language}
              i18n={i18n}
              i18nKey="checkout.addToCart"
              count={values.quantity}
              components={{ price: <Money minor={getDishSelectionTotalMinor(dish, values)} /> }}
            />
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
