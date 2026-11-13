export enum OrderMutationError {
  ResourceUnavailable = 'RESOURCE_UNAVAILABLE',
  InvalidSelection = 'INVALID_SELECTION',
  InvalidTransition = 'INVALID_TRANSITION',
  IdempotencyConflict = 'IDEMPOTENCY_CONFLICT',
  RetryableConflict = 'RETRYABLE_CONFLICT',
}

export type OrderResult<T> =
  | {
      ok: true;
      value: T;
      replayed: boolean;
    }
  | {
      ok: false;
      error: OrderMutationError;
    };

export class ExpectedOrderError extends Error {
  constructor(readonly code: OrderMutationError) {
    super(code);
    this.name = ExpectedOrderError.name;
  }
}

export function orderErrorMessage(error: OrderMutationError): string {
  switch (error) {
    case OrderMutationError.ResourceUnavailable:
      return 'Resource is unavailable.';
    case OrderMutationError.InvalidSelection:
      return 'One or more order selections are invalid.';
    case OrderMutationError.InvalidTransition:
      return 'The order cannot be moved to that status.';
    case OrderMutationError.IdempotencyConflict:
      return 'The idempotency key was already used for another request.';
    case OrderMutationError.RetryableConflict:
      return 'The order could not be committed. Retry with the same idempotency key.';
  }
}
