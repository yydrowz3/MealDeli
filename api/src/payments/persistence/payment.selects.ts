import { Prisma } from '@/generated/prisma/client';

export const PAYMENT_SELECT = {
  id: true,
  provider: true,
  restaurantId: true,
  amountMinor: true,
  currency: true,
  promotionStartsAt: true,
  promotionEndsAt: true,
  createdAt: true,
} as const satisfies Prisma.PaymentSelect;

export type PaymentRecord = Prisma.PaymentGetPayload<{
  select: typeof PAYMENT_SELECT;
}>;
