import { OrderStatus as PrismaOrderStatus } from '@/generated/prisma/enums';
import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  COOKED = 'COOKED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The lifecycle state of an order',
});

export function toPrismaOrderStatus(status: OrderStatus): PrismaOrderStatus {
  switch (status) {
    case OrderStatus.PENDING:
      return PrismaOrderStatus.PENDING;
    case OrderStatus.COOKING:
      return PrismaOrderStatus.COOKING;
    case OrderStatus.COOKED:
      return PrismaOrderStatus.COOKED;
    case OrderStatus.PICKED_UP:
      return PrismaOrderStatus.PICKED_UP;
    case OrderStatus.DELIVERED:
      return PrismaOrderStatus.DELIVERED;
  }
}

export function toPublicOrderStatus(status: PrismaOrderStatus): OrderStatus {
  switch (status) {
    case PrismaOrderStatus.PENDING:
      return OrderStatus.PENDING;
    case PrismaOrderStatus.COOKING:
      return OrderStatus.COOKING;
    case PrismaOrderStatus.COOKED:
      return OrderStatus.COOKED;
    case PrismaOrderStatus.PICKED_UP:
      return OrderStatus.PICKED_UP;
    case PrismaOrderStatus.DELIVERED:
      return OrderStatus.DELIVERED;
  }
}
