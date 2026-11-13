import type { PaymentProvider } from '../domain/payment-provider';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type ProviderEventRejectionReason =
  | 'CHECKOUT_REFERENCE_MISSING'
  | 'UNEXPECTED_COLLECTION_MODE'
  | 'UNEXPECTED_PRICE'
  | 'UNEXPECTED_QUANTITY'
  | 'UNEXPECTED_UNIT_AMOUNT'
  | 'UNEXPECTED_SUBTOTAL'
  | 'UNEXPECTED_DISCOUNT'
  | 'UNEXPECTED_CURRENCY';

export interface VerifiedPromotionPayment {
  kind: 'promotion-payment';
  provider: PaymentProvider;
  providerEventId: string;
  providerNotificationId: string;
  eventType: 'transaction.completed';
  providerTransactionId: string;
  checkoutId: string;
  priceId: string;
  unitAmountMinor: number;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
}

export type VerifiedPaymentWebhook =
  | { kind: 'ignored'; providerEventId: string; eventType: string }
  | {
      kind: 'rejected';
      providerEventId: string;
      eventType: 'transaction.completed';
      reason: ProviderEventRejectionReason;
    }
  | VerifiedPromotionPayment;

export interface PaymentProviderPort {
  createPromotionTransaction(
    checkoutId: string,
  ): Promise<{ transactionId: string }>;
  verifyWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<VerifiedPaymentWebhook>;
}

export class InvalidPaymentWebhookError extends Error {}
export class PaymentProviderContractError extends Error {}
export class PaymentProviderUnavailableError extends Error {}
