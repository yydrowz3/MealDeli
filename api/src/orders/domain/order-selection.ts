import { OrderInputError } from './order-input.error';

export const MAX_ORDER_ITEMS = 25;
export const MAX_SELECTED_OPTIONS = 20;

export interface RequestedOrderOption {
  name: string;
  nameKey: string;
  choice: string | null;
  choiceKey: string | null;
}

export interface RequestedOrderItem {
  dishId: string;
  options: RequestedOrderOption[];
}

export interface SelectedOrderOptionSnapshot {
  name: string;
  choice: string | null;
  extraMinor: number;
}

export function parseRequestedOrderItems(value: unknown): RequestedOrderItem[] {
  if (!Array.isArray(value)) {
    throw new OrderInputError('items must be an array.');
  }
  if (value.length === 0 || value.length > MAX_ORDER_ITEMS) {
    throw new OrderInputError(
      `items must contain between 1 and ${MAX_ORDER_ITEMS} entries.`,
    );
  }

  const dishIds = new Set<string>();
  return value.map((candidate, itemIndex) => {
    const path = `items[${itemIndex}]`;
    assertRecord(candidate, path);
    assertKnownKeys(candidate, ['dishId', 'options'], path);

    if (typeof candidate.dishId !== 'string' || candidate.dishId.length === 0) {
      throw new OrderInputError(`${path}.dishId must be a UUID string.`);
    }
    if (dishIds.has(candidate.dishId)) {
      throw new OrderInputError('Each dish can appear only once in an order.');
    }
    dishIds.add(candidate.dishId);

    const options = candidate.options ?? [];
    if (!Array.isArray(options)) {
      throw new OrderInputError(`${path}.options must be an array.`);
    }
    if (options.length > MAX_SELECTED_OPTIONS) {
      throw new OrderInputError(
        `${path}.options must contain at most ${MAX_SELECTED_OPTIONS} entries.`,
      );
    }

    const optionNames = new Set<string>();
    const parsedOptions = options.map((option, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      assertRecord(option, optionPath);
      assertKnownKeys(option, ['name', 'choice'], optionPath);

      const name = normalizeSelectionName(option.name, `${optionPath}.name`);
      const nameKey = selectionKey(name);
      if (optionNames.has(nameKey)) {
        throw new OrderInputError(
          `${path}.options contains a duplicate option name.`,
        );
      }
      optionNames.add(nameKey);

      const choice = normalizeOptionalSelectionName(
        option.choice,
        `${optionPath}.choice`,
      );
      return {
        name,
        nameKey,
        choice,
        choiceKey: choice === null ? null : selectionKey(choice),
      };
    });

    return {
      dishId: candidate.dishId,
      options: parsedOptions,
    };
  });
}

export function selectionKey(value: string): string {
  return value.toLowerCase();
}

function normalizeSelectionName(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new OrderInputError(`${path} must be a string.`);
  }

  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0 || normalized.length > 60) {
    throw new OrderInputError(
      `${path} must contain between 1 and 60 characters.`,
    );
  }
  return normalized;
}

function normalizeOptionalSelectionName(
  value: unknown,
  path: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return normalizeSelectionName(value, path);
}

function assertRecord(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new OrderInputError(`${path} must be an object.`);
  }
}

function assertKnownKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
): void {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey) {
    throw new OrderInputError(`${path}.${unknownKey} is not allowed.`);
  }
}
