import { CatalogInputError } from '@/catalog/domain/catalog-input.error';

export function normalizeCatalogText(
  value: unknown,
  field: string,
  minimumLength: number,
  maximumLength: number,
): string {
  if (typeof value !== 'string') {
    throw new CatalogInputError(`${field} must be a string.`);
  }
  const normalized = value.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  const length = Array.from(normalized).length;
  if (length < minimumLength || length > maximumLength) {
    throw new CatalogInputError(
      `${field} must contain between ${minimumLength} and ${maximumLength} characters.`,
    );
  }

  return normalized;
}

export function normalizeHttpUrl(value: unknown, field: string): string {
  const text = normalizeCatalogText(value, field, 1, 2_048);
  let parsed: URL;

  try {
    parsed = new URL(text);
  } catch {
    throw new CatalogInputError(`${field} must be a valid HTTP(S) URL.`);
  }

  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    throw new CatalogInputError(
      `${field} must be a valid HTTP(S) URL without credentials.`,
    );
  }

  const canonical = parsed.toString();
  if (canonical.length > 2_048) {
    throw new CatalogInputError(`${field} must not exceed 2048 characters.`);
  }

  return canonical;
}

export function normalizeNullableHttpUrl(
  value: unknown,
  field: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return normalizeHttpUrl(value, field);
}

export function normalizeSearchQuery(value: unknown): string {
  return normalizeCatalogText(value, 'query', 2, 80);
}

export function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}
