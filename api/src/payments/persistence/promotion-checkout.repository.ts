import { PrismaService } from '@/prisma/prisma.service';
import {
  PaymentProvider,
  PromotionCheckoutStatus,
} from '@/generated/prisma/enums';
import { Injectable } from '@nestjs/common';

export interface PendingPromotionCheckout {
  id: string;
}

@Injectable()
export class PromotionCheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerId: string,
    restaurantId: string,
  ): Promise<PendingPromotionCheckout | null> {
    return this.prisma.$transaction(async (transaction) => {
      const restaurant = await transaction.restaurant.findFirst({
        where: {
          id: restaurantId,
          ownerId,
        },
        select: { id: true },
      });

      if (!restaurant) {
        return null;
      }

      return transaction.promotionCheckout.create({
        data: {
          provider: PaymentProvider.PADDLE,
          ownerId,
          restaurantId,
        },
        select: { id: true },
      });
    });
  }

  async attachProviderTransaction(
    checkoutId: string,
    transactionId: string,
  ): Promise<boolean> {
    const updated = await this.prisma.promotionCheckout.updateMany({
      where: {
        id: checkoutId,
        status: PromotionCheckoutStatus.PENDING,
        providerTransactionId: null,
      },
      data: {
        providerTransactionId: transactionId,
        status: PromotionCheckoutStatus.READY,
      },
    });

    return updated.count === 1;
  }

  async markFailed(checkoutId: string, failedAt: Date): Promise<void> {
    await this.prisma.promotionCheckout.updateMany({
      where: {
        id: checkoutId,
        status: PromotionCheckoutStatus.PENDING,
      },
      data: {
        status: PromotionCheckoutStatus.FAILED,
        failedAt,
      },
    });
  }
}
