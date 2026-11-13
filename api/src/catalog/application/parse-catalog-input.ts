import { CatalogInputError } from '../domain/catalog-input.error';
import { BadRequestException } from '@nestjs/common';

export function parseCatalogInput<T>(factory: () => T): T {
  try {
    return factory();
  } catch (error) {
    if (error instanceof CatalogInputError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
