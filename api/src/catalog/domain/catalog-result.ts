export enum CatalogMutationError {
  ResourceUnavailable = 'RESOURCE_UNAVAILABLE',
  CategoryConflict = 'CATEGORY_CONFLICT',
}

export type CatalogResult<T> =
  { ok: true; value: T } | { ok: false; error: CatalogMutationError };

export function catalogErrorMessage(error: CatalogMutationError): string {
  switch (error) {
    case CatalogMutationError.ResourceUnavailable:
      return 'Resource is unavailable.';
    case CatalogMutationError.CategoryConflict:
      return 'Unable to use that category.';
  }
}
