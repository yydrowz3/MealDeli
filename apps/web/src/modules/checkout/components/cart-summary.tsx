import { useI18n } from "../../../shared/i18n";
import { TrashIcon } from "@phosphor-icons/react";

import { Button, Money } from "../../../shared/ui";
import { getCartLineTotalMinor, getCartTotalMinor } from "../model/cart-selectors";
import type { CartState } from "../model/types";

export type CartSummaryProps = {
  cart: CartState;
  invalidLineIds?: ReadonlySet<string>;
  onRemove?: (lineId: string) => void;
  onChangeQuantity?: (lineId: string, quantity: number) => void;
  disabled?: boolean;
};

export function CartSummary({
  cart,
  invalidLineIds = new Set(),
  onRemove,
  onChangeQuantity,
  disabled = false,
}: CartSummaryProps) {
  const { t, text, formatNumber } = useI18n();
  const totalMinor = getCartTotalMinor(cart);
  return (
    <div>
      <ul className="grid list-none gap-4 p-0">
        {cart.lines.map((line) => {
          const invalid = invalidLineIds.has(line.lineId);
          return (
            <li
              className="grid gap-2 border-b border-b-border py-4 data-[invalid]:border-s-4 data-[invalid]:border-s-danger-dark data-[invalid]:ps-3"
              data-invalid={invalid || undefined}
              key={line.lineId}
            >
              <div>
                <h3>{text(line.dishName)}</h3>
                {line.options.map((option) => (
                  <p className="text-muted" key={option.optionId}>
                    {text(option.name)}: {option.choices.map((choice) => choice.name).join(", ")}
                  </p>
                ))}
                {invalid ? <p role="alert">{t("checkout.unavailableItem")}</p> : null}
              </div>
              <Money minor={getCartLineTotalMinor(line)} />
              {onChangeQuantity ? (
                <div
                  aria-label={t("checkout.quantityFor", { name: line.dishName })}
                  className="flex items-center gap-3"
                  role="group"
                >
                  <button
                    aria-label={t("checkout.decreaseItem", { name: line.dishName })}
                    className="min-h-11 min-w-11"
                    disabled={disabled}
                    onClick={() => onChangeQuantity(line.lineId, line.quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <span aria-live="polite">{formatNumber(line.quantity)}</span>
                  <button
                    aria-label={t("checkout.increaseItem", { name: line.dishName })}
                    className="min-h-11 min-w-11"
                    disabled={disabled || line.quantity >= 99}
                    onClick={() => onChangeQuantity(line.lineId, line.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p>
                  {t("checkout.quantityLabel")} {formatNumber(line.quantity)}
                </p>
              )}
              {onRemove ? (
                <Button
                  aria-label={t("checkout.removeNamedItem", { name: line.dishName })}
                  className="justify-self-start"
                  disabled={disabled}
                  onClick={() => onRemove(line.lineId)}
                  size="sm"
                  variant="tertiary"
                >
                  <TrashIcon aria-hidden="true" size={16} />
                  {t("common.remove")}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <dl>
        <div className="flex justify-between">
          <dt>{t("common.subtotal")}</dt>
          <dd>
            <Money minor={totalMinor} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>{t("common.delivery")}</dt>
          <dd>
            <Money minor={0} />
          </dd>
        </div>
        <div className="flex justify-between font-bold">
          <dt>{t("common.total")}</dt>
          <dd>
            <Money minor={totalMinor} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
