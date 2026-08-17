import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Prisma } from '../generated/prisma/client';
import {
  assertPromotionDaysContract,
  PROMOTION_DAYS,
} from './promotion-duration';

@Injectable()
export class PaymentsService {
  private readonly promotionDays: typeof PROMOTION_DAYS;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.promotionDays = assertPromotionDaysContract(
      this.configService.get<string | number>('PROMOTION_DAYS'),
    );
  }

  async createPayment(
    owner: User,
    createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: { id: createPaymentInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Permission denied from restaurant.',
        };
      }
      const date = new Date();
      date.setDate(date.getDate() + this.promotionDays);
      await this.prismaService.$transaction(async (transaction) => {
        await transaction.payment.create({
          data: {
            transactionId: createPaymentInput.transactionId,
            ownerId: owner.id,
            restaurantId: createPaymentInput.restaurantId,
          },
        });
        await transaction.restaurant.update({
          where: { id: restaurant.id },
          data: { promotedUntil: date },
        });
      });
      return {
        ok: true,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          ok: false,
          error: 'This transaction has already been processed.',
        };
      }
      return {
        ok: false,
        error: 'Could not create payment',
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.prismaService.payment.findMany({
        where: {
          ownerId: user.id,
        },
      });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get payments',
      };
    }
  }
}
