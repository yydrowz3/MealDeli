import type { DomainEvent } from './domain-event';

export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');
export const DOMAIN_EVENT_SOURCE = Symbol('DOMAIN_EVENT_SOURCE');

export interface DomainEventPublisher {
  publish(event: DomainEvent): void;
}

export interface ClosableAsyncIterator<T> extends AsyncIterableIterator<T> {
  return(): Promise<IteratorResult<T>>;
}

export interface DomainEventSource {
  open(): ClosableAsyncIterator<DomainEvent>;
}
