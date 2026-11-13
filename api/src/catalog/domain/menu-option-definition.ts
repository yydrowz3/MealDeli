import { CatalogInputError } from './catalog-input.error';
import { normalizeCatalogText } from './catalog-text';
import { parseMoneyMinor } from './money';

const MAX_OPTIONS = 20;
const MAX_CHOICES_PER_OPTION = 20;
const MAX_TOTAL_CHOICES = 100;
const MAX_SERIALIZED_BYTES = 16 * 1_024;

export interface MenuChoiceDefinition {
  name: string;
  extraMinor: number;
}

export type MenuOptionDefinition =
  | {
      name: string;
      extraMinor: number;
      choices?: never;
    }
  | {
      name: string;
      extraMinor?: never;
      choices: MenuChoiceDefinition[];
    };

export function parseMenuOptionDefinitions(
  value: unknown,
): MenuOptionDefinition[] {
  assertSerializedSize(value);

  if (!Array.isArray(value)) {
    throw new CatalogInputError('options must be an array.');
  }
  if (value.length > MAX_OPTIONS) {
    throw new CatalogInputError(
      `options must contain at most ${MAX_OPTIONS} entries.`,
    );
  }

  const optionNames = new Set<string>();
  let totalChoices = 0;

  return value.map((candidate, optionIndex) => {
    assertRecord(candidate, `options[${optionIndex}]`);
    assertKnownKeys(
      candidate,
      ['name', 'extraMinor', 'choices'],
      `options[${optionIndex}]`,
    );

    const name = normalizeCatalogText(
      candidate.name,
      `options[${optionIndex}].name`,
      1,
      60,
    );
    assertUniqueName(optionNames, name, `Duplicate option name: ${name}.`);

    const hasExtra =
      candidate.extraMinor !== undefined && candidate.extraMinor !== null;
    const hasChoices =
      candidate.choices !== undefined && candidate.choices !== null;

    if (hasExtra === hasChoices) {
      throw new CatalogInputError(
        `options[${optionIndex}] must contain exactly one of extraMinor or choices.`,
      );
    }

    if (hasExtra) {
      return {
        name,
        extraMinor: parseMoneyMinor(
          candidate.extraMinor,
          `options[${optionIndex}].extraMinor`,
        ),
      };
    }

    if (!Array.isArray(candidate.choices)) {
      throw new CatalogInputError(
        `options[${optionIndex}].choices must be an array.`,
      );
    }
    if (
      candidate.choices.length === 0 ||
      candidate.choices.length > MAX_CHOICES_PER_OPTION
    ) {
      throw new CatalogInputError(
        `options[${optionIndex}].choices must contain between 1 and ${MAX_CHOICES_PER_OPTION} entries.`,
      );
    }

    totalChoices += candidate.choices.length;
    if (totalChoices > MAX_TOTAL_CHOICES) {
      throw new CatalogInputError(
        `options must contain at most ${MAX_TOTAL_CHOICES} total choices.`,
      );
    }

    const choiceNames = new Set<string>();
    const choices = candidate.choices.map(
      (choice, choiceIndex): MenuChoiceDefinition => {
        const path = `options[${optionIndex}].choices[${choiceIndex}]`;
        assertRecord(choice, path);
        assertKnownKeys(choice, ['name', 'extraMinor'], path);

        const choiceName = normalizeCatalogText(
          choice.name,
          `${path}.name`,
          1,
          60,
        );
        assertUniqueName(
          choiceNames,
          choiceName,
          `Duplicate choice name in option ${name}: ${choiceName}.`,
        );

        return {
          name: choiceName,
          extraMinor: parseMoneyMinor(choice.extraMinor, `${path}.extraMinor`),
        };
      },
    );

    return { name, choices };
  });
}

function assertSerializedSize(value: unknown): void {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new CatalogInputError('options must be JSON serializable.');
  }

  if (
    serialized === undefined ||
    Buffer.byteLength(serialized, 'utf8') > MAX_SERIALIZED_BYTES
  ) {
    throw new CatalogInputError(
      `options must not exceed ${MAX_SERIALIZED_BYTES} UTF-8 bytes.`,
    );
  }
}

function assertRecord(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CatalogInputError(`${path} must be an object.`);
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
    throw new CatalogInputError(`${path}.${unknownKey} is not allowed.`);
  }
}

function assertUniqueName(
  seen: Set<string>,
  name: string,
  errorMessage: string,
): void {
  const key = name.toLowerCase();
  if (seen.has(key)) {
    throw new CatalogInputError(errorMessage);
  }
  seen.add(key);
}
