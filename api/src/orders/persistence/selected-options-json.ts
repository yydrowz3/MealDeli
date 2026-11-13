import type { SelectedOrderOptionSnapshot } from '../domain/order-selection';
import { OrderInputError } from '../domain/order-input.error';
import { Prisma } from '@/generated/prisma/client';

const MAX_SELECTED_OPTIONS = 20;
const MAX_GRAPHQL_INT = 2_147_483_647;

export function toPrismaSelectedOptions(
  options: readonly SelectedOrderOptionSnapshot[],
): Prisma.InputJsonValue {
  return options.map((option): Prisma.InputJsonObject => ({
    name: option.name,
    choice: option.choice,
    extraMinor: option.extraMinor,
  }));
}

export function parseSelectedOptionsSnapshot(
  value: unknown,
): SelectedOrderOptionSnapshot[] {
  if (!Array.isArray(value) || value.length > MAX_SELECTED_OPTIONS) {
    throw new OrderInputError(
      'Persisted selectedOptions must be a bounded array.',
    );
  }

  return value.map((candidate, index) => {
    const path = `selectedOptions[${index}]`;
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      Array.isArray(candidate)
    ) {
      throw new OrderInputError(`${path} must be an object.`);
    }

    const record = candidate as Record<string, unknown>;
    const allowed = new Set(['name', 'choice', 'extraMinor']);
    if (Object.keys(record).some((key) => !allowed.has(key))) {
      throw new OrderInputError(`${path} contains an unknown field.`);
    }

    if (
      typeof record.name !== 'string' ||
      record.name.length === 0 ||
      record.name.length > 60
    ) {
      throw new OrderInputError(`${path}.name is invalid.`);
    }
    if (
      record.choice !== null &&
      (typeof record.choice !== 'string' ||
        record.choice.length === 0 ||
        record.choice.length > 60)
    ) {
      throw new OrderInputError(`${path}.choice is invalid.`);
    }
    if (
      typeof record.extraMinor !== 'number' ||
      !Number.isInteger(record.extraMinor) ||
      record.extraMinor < 0 ||
      record.extraMinor > MAX_GRAPHQL_INT
    ) {
      throw new OrderInputError(`${path}.extraMinor is invalid.`);
    }

    return {
      name: record.name,
      choice: record.choice,
      extraMinor: record.extraMinor,
    };
  });
}
