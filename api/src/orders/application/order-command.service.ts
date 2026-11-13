import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '@/events/domain-event-bus.port';
import {
  assertCourier,
  assertCustomer,
  assertOrderEditor,
} from '../domain/assert-order-role';
import {
  createOrderClaimedEvent,
  createOrderCreatedEvent,
  createOrderStatusChangedEvent,
} from '../domain/order-event';
import { createOrderRequestHash } from '../domain/idempotency';
import { OrderMutationError, type OrderResult } from '../domain/order-result';
import { parseRequestedOrderItems } from '../domain/order-selection';
import { requestedTransition } from '../domain/order-state';
import { PersistedCatalogPricingError } from '../domain/price-order';
import type { OrderStatus } from '../domain/order-status';
import {
  type CommittedOrderFact,
  type CreatedOrder,
  OrderRepository,
} from '../persistence/order.repository';
import { parseOrderInput } from './parse-order-input';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export interface CreateOrderCommand {
  restaurantId: string;
  idempotencyKey: string;
  items: unknown;
}

@Injectable()
export class OrderCommandService {
  private readonly logger = new Logger(OrderCommandService.name);

  constructor(
    private readonly orders: OrderRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    command: CreateOrderCommand,
  ): Promise<OrderResult<CreatedOrder>> {
    assertCustomer(principal);
    const items = parseOrderInput(() =>
      parseRequestedOrderItems(command.items),
    );
    const requestHash = createOrderRequestHash(command.restaurantId, items);

    try {
      const result = await this.orders.create({
        customerId: principal.userId,
        restaurantId: command.restaurantId,
        idempotencyKey: command.idempotencyKey,
        requestHash,
        items,
      });
      if (result.ok && !result.replayed) {
        this.publishAfterCommit(createOrderCreatedEvent(result.value));
      }
      return result;
    } catch (error) {
      if (!(error instanceof PersistedCatalogPricingError)) {
        throw error;
      }
      this.logger.error(
        `Order pricing rejected persisted dish ${error.dishId}.`,
      );
      throw new InternalServerErrorException('Order pricing is unavailable.');
    }
  }

  async edit(
    principal: AuthenticatedPrincipal,
    orderId: string,
    target: OrderStatus,
  ): Promise<OrderResult<CommittedOrderFact>> {
    assertOrderEditor(principal);
    const transition = requestedTransition(principal, target);
    if (!transition) {
      return {
        ok: false,
        error: OrderMutationError.InvalidTransition,
      };
    }

    const result = await this.orders.transition(principal, orderId, transition);
    if (result.ok && !result.replayed) {
      this.publishAfterCommit(
        createOrderStatusChangedEvent(result.value, transition.from),
      );
    }
    return result;
  }

  async take(
    principal: AuthenticatedPrincipal,
    orderId: string,
  ): Promise<OrderResult<CommittedOrderFact>> {
    assertCourier(principal);
    const result = await this.orders.take(principal.userId, orderId);
    if (result.ok && !result.replayed) {
      this.publishAfterCommit(createOrderClaimedEvent(result.value));
    }
    return result;
  }

  private publishAfterCommit(
    event: Parameters<DomainEventPublisher['publish']>[0],
  ): void {
    try {
      this.events.publish(event);
    } catch (error) {
      this.logger.error(
        `Domain event ${event.eventId} failed after the order commit.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
