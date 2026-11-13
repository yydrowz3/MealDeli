import type { DomainEvent } from '@/events/domain-event';
import { randomUUID } from 'node:crypto';

export const PROMOTION_ACTIVATED_EVENT = 'PromotionActivated';
export const PROMOTION_EXPIRED_EVENT = 'PromotionExpired';

export interface CommittedPromotionPaymentFact {
  paymentId: string;
  restaurantId: string;
  ownerId: string;
  promotedUntil: Date;
}

export interface ExpiredPromotionFact {
  restaurantId: string;
  expiredAt: Date;
}

export interface PromotionActivatedEvent extends DomainEvent {
  readonly type: typeof PROMOTION_ACTIVATED_EVENT;
  readonly paymentId: string;
  readonly restaurantId: string;
  readonly ownerId: string;
  readonly promotedUntil: string;
}

export interface PromotionExpiredEvent extends DomainEvent {
  readonly type: typeof PROMOTION_EXPIRED_EVENT;
  readonly restaurantId: string;
  readonly expiredAt: string;
}

export function createPromotionActivatedEvent(
  fact: CommittedPromotionPaymentFact,
  occurredAt: Date,
): PromotionActivatedEvent {
  return {
    eventId: randomUUID(),
    type: PROMOTION_ACTIVATED_EVENT,
    occurredAt: occurredAt.toISOString(),
    paymentId: fact.paymentId,
    restaurantId: fact.restaurantId,
    ownerId: fact.ownerId,
    promotedUntil: fact.promotedUntil.toISOString(),
  };
}

export function createPromotionExpiredEvent(
  fact: ExpiredPromotionFact,
  occurredAt: Date,
): PromotionExpiredEvent {
  return {
    eventId: randomUUID(),
    type: PROMOTION_EXPIRED_EVENT,
    occurredAt: occurredAt.toISOString(),
    restaurantId: fact.restaurantId,
    expiredAt: fact.expiredAt.toISOString(),
  };
}
