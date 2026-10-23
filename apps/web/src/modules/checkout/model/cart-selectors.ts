import type { CartLine, CartState } from "./types";

export function getCartLineUnitMinor(line: CartLine): number {
  return (
    line.basePriceMinor +
    line.options.reduce(
      (optionTotal, option) =>
        optionTotal + option.choices.reduce((total, choice) => total + choice.extraMinor, 0),
      0,
    )
  );
}

export function getCartLineTotalMinor(line: CartLine): number {
  return getCartLineUnitMinor(line) * line.quantity;
}

export function getCartCount(cart: CartState): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

export function getCartTotalMinor(cart: CartState): number {
  return cart.lines.reduce((total, line) => total + getCartLineTotalMinor(line), 0);
}

export function getCartSelectionKey(line: CartLine): string {
  const selections = line.options
    .map((option) => ({
      optionId: option.optionId,
      choiceIds: option.choices.map((choice) => choice.choiceId).sort(),
    }))
    .filter((option) => option.choiceIds.length > 0)
    .sort((left, right) => left.optionId.localeCompare(right.optionId));
  return `${line.dishId}:${JSON.stringify(selections)}`;
}
