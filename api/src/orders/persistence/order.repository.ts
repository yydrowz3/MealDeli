import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { PAGE_SIZE } from '@/common/pagination/page.constants';
import {
  type PageResult,
  pageOffset,
  toPageResult,
} from '@/common/pagination/page.types';
import { Prisma } from '@/generated/prisma/client';
import { OrderStatus as PrismaOrderStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@/users/user-role.enum';
import {
  ExpectedOrderError,
  OrderMutationError,
  type OrderResult,
} from '../domain/order-result';
import type { RequestedOrderItem } from '../domain/order-selection';
import {
  OrderStatus,
  toPrismaOrderStatus,
  toPublicOrderStatus,
} from '../domain/order-status';
import { priceOrder } from '../domain/price-order';
import type { OrderTransition } from '../domain/order-state';
import {
  AVAILABLE_COOKED_ORDER_SELECT,
  ORDER_SELECT,
  ORDERABLE_DISH_SELECT,
  type AvailableCookedOrderRecord,
  type OrderRecord,
} from './order.selects';
import { toPrismaSelectedOptions } from './selected-options-json';
import { Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_TRANSACTION_ATTEMPTS = 3;

export interface CreateOrderRecord {
  customerId: string;
  restaurantId: string;
  idempotencyKey: string;
  requestHash: string;
  items: RequestedOrderItem[];
}

export interface CommittedOrderFact {
  orderId: string;
  status: OrderStatus;
  version: number;
}

export type CreatedOrder = CommittedOrderFact;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderRecord): Promise<OrderResult<CreatedOrder>> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction): Promise<OrderResult<CreatedOrder>> => {
            const existing = await transaction.order.findUnique({
              where: {
                customerId_idempotencyKey: {
                  customerId: input.customerId,
                  idempotencyKey: input.idempotencyKey,
                },
              },
              select: {
                id: true,
                requestHash: true,
                status: true,
                version: true,
              },
            });

            if (existing) {
              return existing.requestHash === input.requestHash
                ? {
                    ok: true,
                    value: toCommittedOrderFact(existing),
                    replayed: true,
                  }
                : {
                    ok: false,
                    error: OrderMutationError.IdempotencyConflict,
                  };
            }

            const restaurant = await transaction.restaurant.findUnique({
              where: { id: input.restaurantId },
              select: {
                id: true,
                dishes: {
                  where: {
                    id: {
                      in: input.items.map((item) => item.dishId),
                    },
                  },
                  select: ORDERABLE_DISH_SELECT,
                },
              },
            });

            if (
              !restaurant ||
              restaurant.dishes.length !== input.items.length
            ) {
              throw new ExpectedOrderError(
                OrderMutationError.ResourceUnavailable,
              );
            }

            const priced = priceOrder(input.items, restaurant.dishes);
            const created = await transaction.order.create({
              data: {
                customerId: input.customerId,
                restaurantId: restaurant.id,
                idempotencyKey: input.idempotencyKey,
                requestHash: input.requestHash,
                totalMinor: priced.totalMinor,
                items: {
                  create: priced.items.map((item, position) => ({
                    position,
                    dishId: item.dishId,
                    dishName: item.dishName,
                    basePriceMinor: item.basePriceMinor,
                    selectedOptions: toPrismaSelectedOptions(
                      item.selectedOptions,
                    ),
                    optionsExtraMinor: item.optionsExtraMinor,
                    lineTotalMinor: item.lineTotalMinor,
                  })),
                },
              },
              select: {
                id: true,
                status: true,
                version: true,
              },
            });

            return {
              ok: true,
              value: toCommittedOrderFact(created),
              replayed: false,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 2_000,
            timeout: 5_000,
          },
        );
      } catch (error) {
        if (error instanceof ExpectedOrderError) {
          return { ok: false, error: error.code };
        }

        if (hasPrismaCode(error, 'P2003')) {
          return {
            ok: false,
            error: OrderMutationError.ResourceUnavailable,
          };
        }

        if (hasPrismaCode(error, 'P2002')) {
          return this.resolveIdempotencyRace(input);
        }

        if (hasPrismaCode(error, 'P2034')) {
          if (attempt === MAX_TRANSACTION_ATTEMPTS) {
            return {
              ok: false,
              error: OrderMutationError.RetryableConflict,
            };
          }
          await delay(attempt * 10 + Math.floor(Math.random() * 10));
          continue;
        }

        throw error;
      }
    }

    return {
      ok: false,
      error: OrderMutationError.RetryableConflict,
    };
  }

  findScoped(
    principal: AuthenticatedPrincipal,
    orderId: string,
  ): Promise<OrderRecord | null> {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...scopeWhere(principal),
      },
      select: ORDER_SELECT,
    });
  }

  findAvailableCooked(
    orderId: string,
  ): Promise<AvailableCookedOrderRecord | null> {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        status: PrismaOrderStatus.COOKED,
        courierId: null,
      },
      select: AVAILABLE_COOKED_ORDER_SELECT,
    });
  }

  async listScoped(
    principal: AuthenticatedPrincipal,
    status: OrderStatus | undefined,
    page: number,
  ): Promise<PageResult<OrderRecord>> {
    const where: Prisma.OrderWhereInput = {
      ...scopeWhere(principal),
      ...(status === undefined ? {} : { status: toPrismaOrderStatus(status) }),
    };

    const [orders, totalResults] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: ORDER_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pageOffset(page),
        take: PAGE_SIZE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return toPageResult(orders, totalResults);
  }

  async transition(
    principal: AuthenticatedPrincipal,
    orderId: string,
    transition: OrderTransition,
  ): Promise<OrderResult<CommittedOrderFact>> {
    const actorWhere = editorScopeWhere(principal);
    const updated = await this.prisma.order.updateManyAndReturn({
      where: {
        id: orderId,
        status: toPrismaOrderStatus(transition.from),
        ...actorWhere,
      },
      data: {
        status: toPrismaOrderStatus(transition.to),
        version: { increment: 1 },
      },
      select: {
        id: true,
        status: true,
        version: true,
      },
    });

    if (updated.length === 1) {
      return {
        ok: true,
        value: toCommittedOrderFact(updated[0]),
        replayed: false,
      };
    }

    const replay = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        status: toPrismaOrderStatus(transition.to),
        ...actorWhere,
      },
      select: {
        id: true,
        status: true,
        version: true,
      },
    });

    return replay
      ? {
          ok: true,
          value: toCommittedOrderFact(replay),
          replayed: true,
        }
      : { ok: false, error: OrderMutationError.InvalidTransition };
  }

  async take(
    courierId: string,
    orderId: string,
  ): Promise<OrderResult<CommittedOrderFact>> {
    const updated = await this.prisma.order.updateManyAndReturn({
      where: {
        id: orderId,
        status: toPrismaOrderStatus(OrderStatus.COOKED),
        courierId: null,
      },
      data: {
        courierId,
        version: { increment: 1 },
      },
      select: {
        id: true,
        status: true,
        version: true,
      },
    });

    if (updated.length === 1) {
      return {
        ok: true,
        value: toCommittedOrderFact(updated[0]),
        replayed: false,
      };
    }

    const replay = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        courierId,
        status: {
          in: [
            toPrismaOrderStatus(OrderStatus.COOKED),
            toPrismaOrderStatus(OrderStatus.PICKED_UP),
            toPrismaOrderStatus(OrderStatus.DELIVERED),
          ],
        },
      },
      select: {
        id: true,
        status: true,
        version: true,
      },
    });

    return replay
      ? {
          ok: true,
          value: toCommittedOrderFact(replay),
          replayed: true,
        }
      : { ok: false, error: OrderMutationError.ResourceUnavailable };
  }

  private async resolveIdempotencyRace(
    input: CreateOrderRecord,
  ): Promise<OrderResult<CreatedOrder>> {
    const winner = await this.prisma.order.findUnique({
      where: {
        customerId_idempotencyKey: {
          customerId: input.customerId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      select: {
        id: true,
        requestHash: true,
        status: true,
        version: true,
      },
    });

    if (!winner) {
      return { ok: false, error: OrderMutationError.RetryableConflict };
    }

    return winner.requestHash === input.requestHash
      ? {
          ok: true,
          value: toCommittedOrderFact(winner),
          replayed: true,
        }
      : {
          ok: false,
          error: OrderMutationError.IdempotencyConflict,
        };
  }
}

function scopeWhere(principal: AuthenticatedPrincipal): Prisma.OrderWhereInput {
  switch (principal.role) {
    case UserRole.CUSTOMER:
      return { customerId: principal.userId };
    case UserRole.OWNER:
      return {
        restaurant: {
          is: { ownerId: principal.userId },
        },
      };
    case UserRole.COURIER:
      return { courierId: principal.userId };
  }
}

function editorScopeWhere(
  principal: AuthenticatedPrincipal,
): Prisma.OrderWhereInput {
  switch (principal.role) {
    case UserRole.OWNER:
      return {
        restaurant: {
          is: { ownerId: principal.userId },
        },
      };
    case UserRole.COURIER:
      return { courierId: principal.userId };
    case UserRole.CUSTOMER:
      throw new Error('Customer cannot edit orders.');
  }
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

function toCommittedOrderFact(order: {
  id: string;
  status: PrismaOrderStatus;
  version: number;
}): CommittedOrderFact {
  return {
    orderId: order.id,
    status: toPublicOrderStatus(order.status),
    version: order.version,
  };
}
