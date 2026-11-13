import { createHash } from 'node:crypto';
import { CatalogInputError } from './catalog-input.error';
import { normalizeCatalogText } from './catalog-text';

const MAX_SLUG_LENGTH = 100;
const SLUG_HASH_LENGTH = 8;
const SLUG_SEPARATOR_LENGTH = 1;
const MAX_SLUG_BASE_LENGTH =
  MAX_SLUG_LENGTH - SLUG_HASH_LENGTH - SLUG_SEPARATOR_LENGTH;

export interface NormalizedCategoryName {
  name: string;
  normalizedName: string;
  slug: string;
}

export function normalizeCategoryName(value: unknown): NormalizedCategoryName {
  const name = normalizeCatalogText(value, 'categoryName', 1, 80);
  const normalizedName = name.toLowerCase();
  if (Array.from(normalizedName).length > 80) {
    throw new CatalogInputError(
      'categoryName must not exceed 80 normalized characters.',
    );
  }
  const slugBase = normalizedName
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  if (slugBase.length === 0) {
    throw new CatalogInputError(
      'categoryName must contain at least one letter or number.',
    );
  }

  const hash = createHash('sha256')
    .update(normalizedName, 'utf8')
    .digest('hex')
    .slice(0, SLUG_HASH_LENGTH);
  const boundedBase = Array.from(slugBase)
    .slice(0, MAX_SLUG_BASE_LENGTH)
    .join('');

  return {
    name,
    normalizedName,
    slug: `${boundedBase}-${hash}`,
  };
}

export function normalizeCategorySlug(value: unknown): string {
  const slug = normalizeCatalogText(
    value,
    'slug',
    1,
    MAX_SLUG_LENGTH,
  ).toLowerCase();

  if (!/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug)) {
    throw new CatalogInputError('slug has an invalid format.');
  }

  return slug;
}
