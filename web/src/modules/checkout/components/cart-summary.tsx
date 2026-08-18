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
  const totalMinor = getCartTotalMinor(cart);
  return (
    <div className="checkout-cart-summary">
      <ul className="checkout-cart-lines">
        {cart.lines.map((line) => {
          const invalid = invalidLineIds.has(line.lineId);
          return (
            <li className="checkout-cart-line" data-invalid={invalid || undefined} key={line.lineId}>
              <div>
                <h3>{line.dishName}</h3>
                {line.options.map((option) => (
                  <p className="checkout-cart-line__option" key={option.optionId}>
                    {option.name}: {option.choices.map((choice) => choice.name).join(", ")}
                  </p>
                ))}
                {invalid ? <p role="alert">This item is no longer available.</p> : null}
              </div>
              <Money minor={getCartLineTotalMinor(line)} />
              {onChangeQuantity ? (
                <div aria-label={`Quantity for ${line.dishName}`} className="checkout-stepper" role="group">
                  <button
                    aria-label={`Decrease ${line.dishName} quantity`}
                    disabled={disabled}
                    onClick={() => onChangeQuantity(line.lineId, line.quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <span aria-live="polite">{line.quantity}</span>
                  <button
                    aria-label={`Increase ${line.dishName} quantity`}
                    disabled={disabled || line.quantity >= 99}
                    onClick={() => onChangeQuantity(line.lineId, line.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p>Quantity: {line.quantity}</p>
              )}
              {onRemove ? (
                <Button
                  aria-label={`Remove ${line.dishName}`}
                  className="checkout-remove-button"
                  disabled={disabled}
                  onClick={() => onRemove(line.lineId)}
                  size="sm"
                  variant="tertiary"
                >
                  <TrashIcon aria-hidden="true" size={16} />
                  Remove
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <dl className="checkout-totals">
        <div>
          <dt>Subtotal</dt>
          <dd><Money minor={totalMinor} /></dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd><Money minor={0} /></dd>
        </div>
        <div className="checkout-totals__total">
          <dt>Total</dt>
          <dd><Money minor={totalMinor} /></dd>
        </div>
      </dl>
    </div>
  );
}
