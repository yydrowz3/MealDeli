import type { DomainEvent } from '@/events/domain-event';
import type { OrderStatus } from './order-status';
import { randomUUID } from 'node:crypto';

export const ORDER_CREATED_EVENT = 'order.created.v1';
export const ORDER_STATUS_CHANGED_EVENT = 'order.status-changed.v1';
export const ORDER_CLAIMED_EVENT = 'order.claimed.v1';

export interface OrderEventFact {
  orderId: string;
  status: OrderStatus;
  version: number;
}

interface OrderEventBase extends DomainEvent, OrderEventFact {}

export interface OrderCreatedEvent extends OrderEventBase {
  readonly type: typeof ORDER_CREATED_EVENT;
}

export interface OrderStatusChangedEvent extends OrderEventBase {
  readonly type: typeof ORDER_STATUS_CHANGED_EVENT;
  readonly previousStatus: OrderStatus;
}

export interface OrderClaimedEvent extends OrderEventBase {
  readonly type: typeof ORDER_CLAIMED_EVENT;
}

export type OrderDomainEvent =
  OrderCreatedEvent | OrderStatusChangedEvent | OrderClaimedEvent;

export function createOrderCreatedEvent(
  fact: OrderEventFact,
): OrderCreatedEvent {
  return {
    ...newEventMetadata(),
    type: ORDER_CREATED_EVENT,
    ...fact,
  };
}

export function createOrderStatusChangedEvent(
  fact: OrderEventFact,
  previousStatus: OrderStatus,
): OrderStatusChangedEvent {
  return {
    ...newEventMetadata(),
    type: ORDER_STATUS_CHANGED_EVENT,
    ...fact,
    previousStatus,
  };
}

export function createOrderClaimedEvent(
  fact: OrderEventFact,
): OrderClaimedEvent {
  return {
    ...newEventMetadata(),
    type: ORDER_CLAIMED_EVENT,
    ...fact,
  };
}

export function isOrderDomainEvent(
  event: DomainEvent,
): event is OrderDomainEvent {
  return (
    event.type === ORDER_CREATED_EVENT ||
    event.type === ORDER_STATUS_CHANGED_EVENT ||
    event.type === ORDER_CLAIMED_EVENT
  );
}

function newEventMetadata(): Pick<DomainEvent, 'eventId' | 'occurredAt'> {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
  };
}
