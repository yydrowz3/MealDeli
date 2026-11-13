import { PAGE_SIZE } from '@/common/pagination/page.constants';
import {
  PageResult,
  pageOffset,
  toPageResult,
} from '@/common/pagination/page.types';
import { Prisma } from '@/generated/prisma/client';
import {
  PaymentProvider,
  PromotionCheckoutStatus,
} from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { PROMOTION_DURATION_MS } from '../domain/promotion.constants';
import type { CommittedPromotionPaymentFact } from '../domain/promotion-event';
import type { VerifiedPromotionPayment } from '../integrations/payment-provider.port';
import { PAYMENT_SELECT, PaymentRecord } from './payment.selects';
import { Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_TRANSACTION_ATTEMPTS = 3;

export type ApplyPromotionPaymentResult =
  | { kind: 'applied'; fact: CommittedPromotionPaymentFact }
  | { kind: 'replayed' }
  | {
      kind: 'rejected';
      reason:
        'CHECKOUT_UNAVAILABLE' | 'CHECKOUT_NOT_READY' | 'TRANSACTION_MISMATCH';
    };

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async applyPromotionPayment(
    input: VerifiedPromotionPayment,
    receivedAt: Date,
  ): Promise<ApplyPromotionPaymentResult> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction): Promise<ApplyPromotionPaymentResult> => {
            const existingEvent =
              await transaction.paymentWebhookEvent.findUnique({
                where: { providerEventId: input.providerEventId },
                select: { id: true },
              });
            if (existingEvent) {
              return { kind: 'replayed' };
            }

            const checkout = await transaction.promotionCheckout.findUnique({
              where: { id: input.checkoutId },
              select: {
                id: true,
                provider: true,
                ownerId: true,
                restaurantId: true,
                providerTransactionId: true,
                status: true,
                restaurant: {
                  select: { promotedUntil: true },
                },
                payment: {
                  select: { providerTransactionId: true },
                },
              },
            });

            if (!checkout || checkout.provider !== PaymentProvider.PADDLE) {
              return { kind: 'rejected', reason: 'CHECKOUT_UNAVAILABLE' };
            }

            if (checkout.status === PromotionCheckoutStatus.COMPLETED) {
              return checkout.payment?.providerTransactionId ===
                input.providerTransactionId
                ? { kind: 'replayed' }
                : { kind: 'rejected', reason: 'TRANSACTION_MISMATCH' };
            }

            if (checkout.status !== PromotionCheckoutStatus.READY) {
              return { kind: 'rejected', reason: 'CHECKOUT_NOT_READY' };
            }

            if (
              checkout.providerTransactionId !== input.providerTransactionId
            ) {
              return { kind: 'rejected', reason: 'TRANSACTION_MISMATCH' };
            }

            const promotionStartsAt = laterDate(
              receivedAt,
              checkout.restaurant.promotedUntil,
            );
            const promotionEndsAt = new Date(
              promotionStartsAt.getTime() + PROMOTION_DURATION_MS,
            );

            const webhookEvent = await transaction.paymentWebhookEvent.create({
              data: {
                provider: PaymentProvider.PADDLE,
                providerEventId: input.providerEventId,
                providerNotificationId: input.providerNotificationId,
                eventType: input.eventType,
                providerTransactionId: input.providerTransactionId,
                occurredAt: input.occurredAt,
                receivedAt,
              },
              select: { id: true },
            });

            const completed = await transaction.promotionCheckout.updateMany({
              where: {
                id: checkout.id,
                status: PromotionCheckoutStatus.READY,
                providerTransactionId: input.providerTransactionId,
              },
              data: {
                status: PromotionCheckoutStatus.COMPLETED,
                completedAt: receivedAt,
              },
            });
            if (completed.count !== 1) {
              throw new PromotionCheckoutRaceError();
            }

            await transaction.restaurant.update({
              where: { id: checkout.restaurantId },
              data: { promotedUntil: promotionEndsAt },
              select: { id: true },
            });

            const payment = await transaction.payment.create({
              data: {
                provider: PaymentProvider.PADDLE,
                ownerId: checkout.ownerId,
                restaurantId: checkout.restaurantId,
                checkoutId: checkout.id,
                webhookEventId: webhookEvent.id,
                providerTransactionId: input.providerTransactionId,
                priceId: input.priceId,
                unitAmountMinor: input.unitAmountMinor,
                amountMinor: input.amountMinor,
                currency: input.currency,
                promotionStartsAt,
                promotionEndsAt,
              },
              select: { id: true },
            });

            return {
              kind: 'applied',
              fact: {
                paymentId: payment.id,
                restaurantId: checkout.restaurantId,
                ownerId: checkout.ownerId,
                promotedUntil: promotionEndsAt,
              },
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 2_000,
            timeout: 5_000,
          },
        );
      } catch (error) {
        if (
          error instanceof PromotionCheckoutRaceError ||
          hasPrismaCode(error, 'P2034')
        ) {
          if (attempt === MAX_TRANSACTION_ATTEMPTS) {
            throw error;
          }
          await delay(attempt * 10 + Math.floor(Math.random() * 10));
          continue;
        }

        if (hasPrismaCode(error, 'P2002')) {
          const replay = await this.resolveReplay(input);
          if (replay) {
            return { kind: 'replayed' };
          }
        }

        throw error;
      }
    }

    throw new Error('Promotion payment transaction retry exhausted.');
  }

  async listOwnerPayments(
    ownerId: string,
    page: number,
  ): Promise<PageResult<PaymentRecord>> {
    const where: Prisma.PaymentWhereInput = { ownerId };
    const [payments, totalResults] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        select: PAYMENT_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pageOffset(page),
        take: PAGE_SIZE,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return toPageResult(payments, totalResults);
  }

  private async resolveReplay(
    input: VerifiedPromotionPayment,
  ): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { checkoutId: input.checkoutId },
          { providerTransactionId: input.providerTransactionId },
          {
            webhookEvent: {
              is: { providerEventId: input.providerEventId },
            },
          },
        ],
      },
      select: { id: true },
    });

    return payment !== null;
  }
}

class PromotionCheckoutRaceError extends Error {}

function laterDate(receivedAt: Date, promotedUntil: Date | null): Date {
  return promotedUntil && promotedUntil.getTime() > receivedAt.getTime()
    ? promotedUntil
    : receivedAt;
}

function hasPrismaCode(
  error: unknown,
  code: string,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
