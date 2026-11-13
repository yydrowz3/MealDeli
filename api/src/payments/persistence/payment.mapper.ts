import { PaymentProvider as PrismaPaymentProvider } from '@/generated/prisma/enums';
import { PaymentProvider } from '../domain/payment-provider';
import { PaymentModel } from '../models/payment.model';
import { PaymentRecord } from './payment.selects';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentMapper {
  toModel(payment: PaymentRecord): PaymentModel {
    return {
      id: payment.id,
      provider: toPublicProvider(payment.provider),
      restaurantId: payment.restaurantId,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      promotionStartsAt: payment.promotionStartsAt,
      promotionEndsAt: payment.promotionEndsAt,
      createdAt: payment.createdAt,
    };
  }
}

function toPublicProvider(provider: PrismaPaymentProvider): PaymentProvider {
  switch (provider) {
    case PrismaPaymentProvider.PADDLE:
      return PaymentProvider.PADDLE;
  }
}
