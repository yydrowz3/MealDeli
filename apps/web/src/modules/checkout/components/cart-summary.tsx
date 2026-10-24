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
    <div>
      <ul className="m-0 grid list-none gap-4 p-0">
        {cart.lines.map((line) => {
          const invalid = invalidLineIds.has(line.lineId);
          return (
            <li
              className="grid gap-2 border-b border-solid border-b-[var(--ui-color-border,#d9d9d9)] py-4 data-[invalid]:border-s-4 data-[invalid]:border-s-[var(--ui-color-danger,#b42318)] data-[invalid]:ps-3 [&_h3]:m-0 [&_p]:m-0"
              data-invalid={invalid || undefined}
              key={line.lineId}
            >
              <div>
                <h3>{line.dishName}</h3>
                {line.options.map((option) => (
                  <p className="text-[var(--ui-color-text-muted,#666)]" key={option.optionId}>
                    {option.name}: {option.choices.map((choice) => choice.name).join(", ")}
                  </p>
                ))}
                {invalid ? <p role="alert">This item is no longer available.</p> : null}
              </div>
              <Money minor={getCartLineTotalMinor(line)} />
              {onChangeQuantity ? (
                <div
                  aria-label={`Quantity for ${line.dishName}`}
                  className="flex items-center gap-3"
                  role="group"
                >
                  <button
                    aria-label={`Decrease ${line.dishName} quantity`}
                    className="min-h-11 min-w-11"
                    disabled={disabled}
                    onClick={() => onChangeQuantity(line.lineId, line.quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <span aria-live="polite">{line.quantity}</span>
                  <button
                    aria-label={`Increase ${line.dishName} quantity`}
                    className="min-h-11 min-w-11"
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
                  className="[justify-self:start] text-jade-dark! [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2"
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
      <dl>
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>
            <Money minor={totalMinor} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>
            <Money minor={0} />
          </dd>
        </div>
        <div className="flex justify-between font-bold">
          <dt>Total</dt>
          <dd>
            <Money minor={totalMinor} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
