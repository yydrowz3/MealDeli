import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import {
  DOMAIN_EVENT_SOURCE,
  type DomainEventSource,
} from '@/events/domain-event-bus.port';
import { filterMapAsyncIterator } from '@/events/filter-map-async-iterator';
import {
  assertCourier,
  assertOrderViewer,
  assertOwner,
} from '../domain/assert-order-role';
import {
  isOrderDomainEvent,
  ORDER_CREATED_EVENT,
  ORDER_STATUS_CHANGED_EVENT,
  type OrderDomainEvent,
} from '../domain/order-event';
import { OrderStatus } from '../domain/order-status';
import type { CookedOrderOfferModel } from '../models/cooked-order-offer.model';
import type { OrderModel } from '../models/order.model';
import { Inject, Injectable } from '@nestjs/common';
import { OrderQueryService } from './order-query.service';

export interface PendingOrdersPayload {
  pendingOrders: OrderModel;
}

export interface CookedOrdersPayload {
  cookedOrders: CookedOrderOfferModel;
}

export interface OrderUpdatesPayload {
  orderUpdates: OrderModel;
}

@Injectable()
export class OrderSubscriptionService {
  constructor(
    @Inject(DOMAIN_EVENT_SOURCE)
    private readonly events: DomainEventSource,
    private readonly queries: OrderQueryService,
  ) {}

  pendingOrders(
    principal: AuthenticatedPrincipal,
  ): AsyncIterableIterator<PendingOrdersPayload> {
    assertOwner(principal);
    return filterMapAsyncIterator(this.events.open(), async (event) => {
      if (!isOrderDomainEvent(event) || event.type !== ORDER_CREATED_EVENT) {
        return null;
      }

      const order = await this.queries.getOrder(principal, event.orderId);
      return isCurrent(order, event, OrderStatus.PENDING)
        ? { pendingOrders: order }
        : null;
    });
  }

  cookedOrders(
    principal: AuthenticatedPrincipal,
  ): AsyncIterableIterator<CookedOrdersPayload> {
    assertCourier(principal);
    return filterMapAsyncIterator(this.events.open(), async (event) => {
      if (
        !isOrderDomainEvent(event) ||
        event.type !== ORDER_STATUS_CHANGED_EVENT ||
        event.status !== OrderStatus.COOKED
      ) {
        return null;
      }

      const order = await this.queries.getAvailableCookedOrder(event.orderId);
      return isCurrent(order, event, OrderStatus.COOKED)
        ? { cookedOrders: order }
        : null;
    });
  }

  async orderUpdates(
    principal: AuthenticatedPrincipal,
    orderId: string,
  ): Promise<AsyncIterableIterator<OrderUpdatesPayload> | null> {
    assertOrderViewer(principal);

    const source = this.events.open();
    try {
      const current = await this.queries.getOrder(principal, orderId);
      if (!current) {
        await source.return();
        return null;
      }
    } catch (error) {
      await source.return();
      throw error;
    }

    return filterMapAsyncIterator(source, async (event) => {
      if (!isOrderDomainEvent(event) || event.orderId !== orderId) {
        return null;
      }

      const order = await this.queries.getOrder(principal, orderId);
      return isCurrent(order, event) ? { orderUpdates: order } : null;
    });
  }
}

interface VersionedOrderSnapshot {
  status: OrderStatus;
  version: number;
}

function isCurrent<TOrder extends VersionedOrderSnapshot>(
  order: TOrder | null,
  event: OrderDomainEvent,
  requiredStatus?: OrderStatus,
): order is TOrder {
  return (
    order !== null &&
    order.version === event.version &&
    (requiredStatus === undefined || order.status === requiredStatus)
  );
}
