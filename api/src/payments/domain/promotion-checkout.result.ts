export enum PromotionCheckoutError {
  ResourceUnavailable = 'RESOURCE_UNAVAILABLE',
  ProviderUnavailable = 'PROVIDER_UNAVAILABLE',
}

export type PromotionCheckoutResult =
  | { ok: true; transactionId: string }
  | { ok: false; error: PromotionCheckoutError };
