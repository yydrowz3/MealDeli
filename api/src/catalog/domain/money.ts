import { CatalogInputError } from './catalog-input.error';

export const MAX_MONEY_MINOR = 100_000_000;

export function parseMoneyMinor(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_MONEY_MINOR
  ) {
    throw new CatalogInputError(
      `${field} must be an integer between 0 and ${MAX_MONEY_MINOR}.`,
    );
  }

  return value;
}
