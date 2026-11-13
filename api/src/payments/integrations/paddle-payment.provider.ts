import { EnvironmentVariables } from '@/config/environment.variables';
import { PaymentProvider } from '../domain/payment-provider';
import { PROMOTION_CHECKOUT_CUSTOM_DATA_KEY } from '../domain/promotion.constants';
import {
  InvalidPaymentWebhookError,
  PaymentProviderContractError,
  PaymentProviderPort,
  PaymentProviderUnavailableError,
  ProviderEventRejectionReason,
  VerifiedPaymentWebhook,
} from './payment-provider.port';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { z } from 'zod';

const paddleEventId = z.string().regex(/^evt_[a-z0-9]{26}$/);
const paddleNotificationId = z.string().regex(/^ntf_[a-z0-9]{26}$/);
const paddleTransactionId = z.string().regex(/^txn_[a-z0-9]{26}$/);
const paddlePriceId = z.string().regex(/^pri_[a-z0-9]{26}$/);
const minorAmount = z.string().regex(/^\d{1,10}$/);
const uuidV7 = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

const eventEnvelopeSchema = z.object({
  eventId: paddleEventId,
  eventType: z.string().min(1).max(80),
});

const completedTransactionEventSchema = z.object({
  eventId: paddleEventId,
  eventType: z.literal('transaction.completed'),
  occurredAt: z.string().datetime({ offset: true }),
  notificationId: paddleNotificationId,
  data: z.object({
    id: paddleTransactionId,
    status: z.literal('completed'),
    collectionMode: z.string(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
    customData: z.record(z.string(), z.unknown()).nullable(),
    items: z.array(
      z.object({
        quantity: z.number().int().positive(),
        price: z.object({
          id: paddlePriceId,
          unitPrice: z.object({
            amount: minorAmount,
            currencyCode: z.string().regex(/^[A-Z]{3}$/),
          }),
        }),
      }),
    ),
    details: z.object({
      totals: z.object({
        subtotal: minorAmount,
        discount: minorAmount,
        grandTotal: minorAmount,
        currencyCode: z.string().regex(/^[A-Z]{3}$/),
      }),
    }),
  }),
});

@Injectable()
export class PaddlePaymentProvider implements PaymentProviderPort {
  private readonly paddle: Paddle;
  private readonly webhookSecret: string;
  private readonly promotionPriceId: string;
  private readonly promotionUnitPriceMinor: number;
  private readonly promotionCurrency: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const environment = config.get('PADDLE_ENVIRONMENT', { infer: true });
    this.paddle = new Paddle(config.get('PADDLE_API_KEY', { infer: true }), {
      environment:
        environment === 'sandbox'
          ? Environment.sandbox
          : Environment.production,
      logLevel: LogLevel.error,
    });
    this.webhookSecret = config.get('PADDLE_WEBHOOK_SECRET', { infer: true });
    this.promotionPriceId = config.get('PADDLE_PROMOTION_PRICE_ID', {
      infer: true,
    });
    this.promotionUnitPriceMinor = config.get(
      'PADDLE_PROMOTION_UNIT_PRICE_MINOR',
      {
        infer: true,
      },
    );
    this.promotionCurrency = config.get('PADDLE_PROMOTION_CURRENCY', {
      infer: true,
    });
    this.timeoutMs = config.get('PADDLE_API_TIMEOUT_MS', { infer: true });
  }

  async createPromotionTransaction(
    checkoutId: string,
  ): Promise<{ transactionId: string }> {
    try {
      const transaction = await withTimeout(
        this.paddle.transactions.create({
          collectionMode: 'automatic',
          items: [{ priceId: this.promotionPriceId, quantity: 1 }],
          customData: {
            [PROMOTION_CHECKOUT_CUSTOM_DATA_KEY]: checkoutId,
          },
        }),
        this.timeoutMs,
      );

      return { transactionId: transaction.id };
    } catch {
      throw new PaymentProviderUnavailableError(
        'Paddle transaction creation failed.',
      );
    }
  }

  async verifyWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<VerifiedPaymentWebhook> {
    let unmarshalled: unknown;
    try {
      unmarshalled = await this.paddle.webhooks.unmarshal(
        rawBody.toString('utf8'),
        this.webhookSecret,
        signature,
      );
    } catch {
      throw new InvalidPaymentWebhookError(
        'Paddle signature verification failed.',
      );
    }

    const envelope = eventEnvelopeSchema.safeParse(unmarshalled);
    if (!envelope.success) {
      throw new PaymentProviderContractError(
        'Verified Paddle event envelope is invalid.',
      );
    }

    if (envelope.data.eventType !== 'transaction.completed') {
      return {
        kind: 'ignored',
        providerEventId: envelope.data.eventId,
        eventType: envelope.data.eventType,
      };
    }

    const completed = completedTransactionEventSchema.safeParse(unmarshalled);
    if (!completed.success) {
      throw new PaymentProviderContractError(
        'Verified Paddle transaction.completed payload is invalid.',
      );
    }

    const event = completed.data;
    const rejection = this.rejectionReason(event.data);
    if (rejection) {
      return {
        kind: 'rejected',
        providerEventId: event.eventId,
        eventType: event.eventType,
        reason: rejection,
      };
    }

    const checkoutId =
      event.data.customData?.[PROMOTION_CHECKOUT_CUSTOM_DATA_KEY];
    if (typeof checkoutId !== 'string') {
      throw new PaymentProviderContractError(
        'Promotion checkout reference disappeared.',
      );
    }

    const item = event.data.items[0];
    return {
      kind: 'promotion-payment',
      provider: PaymentProvider.PADDLE,
      providerEventId: event.eventId,
      providerNotificationId: event.notificationId,
      eventType: event.eventType,
      providerTransactionId: event.data.id,
      checkoutId,
      priceId: item.price.id,
      unitAmountMinor: toMinor(item.price.unitPrice.amount),
      amountMinor: toMinor(event.data.details.totals.grandTotal),
      currency: event.data.details.totals.currencyCode,
      occurredAt: new Date(event.occurredAt),
    };
  }

  private rejectionReason(
    transaction: z.infer<typeof completedTransactionEventSchema>['data'],
  ): ProviderEventRejectionReason | null {
    const checkoutId =
      transaction.customData?.[PROMOTION_CHECKOUT_CUSTOM_DATA_KEY];
    if (
      typeof checkoutId !== 'string' ||
      !uuidV7.safeParse(checkoutId).success
    ) {
      return 'CHECKOUT_REFERENCE_MISSING';
    }

    if (transaction.collectionMode !== 'automatic') {
      return 'UNEXPECTED_COLLECTION_MODE';
    }

    if (
      transaction.items.length !== 1 ||
      transaction.items[0].price.id !== this.promotionPriceId
    ) {
      return 'UNEXPECTED_PRICE';
    }

    if (transaction.items[0].quantity !== 1) {
      return 'UNEXPECTED_QUANTITY';
    }

    if (
      toMinor(transaction.items[0].price.unitPrice.amount) !==
      this.promotionUnitPriceMinor
    ) {
      return 'UNEXPECTED_UNIT_AMOUNT';
    }

    if (
      toMinor(transaction.details.totals.subtotal) !==
      this.promotionUnitPriceMinor
    ) {
      return 'UNEXPECTED_SUBTOTAL';
    }

    if (toMinor(transaction.details.totals.discount) !== 0) {
      return 'UNEXPECTED_DISCOUNT';
    }

    const currencies = [
      transaction.currencyCode,
      transaction.items[0].price.unitPrice.currencyCode,
      transaction.details.totals.currencyCode,
    ];
    if (currencies.some((currency) => currency !== this.promotionCurrency)) {
      return 'UNEXPECTED_CURRENCY';
    }

    return null;
  }
}

function toMinor(value: string): number {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 2_147_483_647) {
    throw new PaymentProviderContractError(
      'Paddle amount is outside the supported range.',
    );
  }
  return amount;
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () =>
        reject(
          new PaymentProviderUnavailableError('Paddle request timed out.'),
        ),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
