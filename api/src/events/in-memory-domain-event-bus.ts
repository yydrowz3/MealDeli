import type { DomainEvent } from './domain-event';
import type {
  ClosableAsyncIterator,
  DomainEventPublisher,
  DomainEventSource,
} from './domain-event-bus.port';
import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';

const MAX_BUFFERED_EVENTS_PER_SUBSCRIBER = 64;

interface PendingNext {
  resolve(result: IteratorResult<DomainEvent>): void;
  reject(error: unknown): void;
}

@Injectable()
export class InMemoryDomainEventBus
  implements DomainEventPublisher, DomainEventSource, OnApplicationShutdown
{
  private readonly logger = new Logger(InMemoryDomainEventBus.name);
  private readonly subscribers = new Set<BufferedEventSubscription>();
  private stopped = false;

  publish(event: DomainEvent): void {
    if (this.stopped) {
      this.logger.warn(
        `Dropped domain event ${event.eventId} during shutdown.`,
      );
      return;
    }

    for (const subscriber of [...this.subscribers]) {
      subscriber.push(event);
    }
  }

  open(): ClosableAsyncIterator<DomainEvent> {
    if (this.stopped) {
      return completedIterator();
    }

    let subscription: BufferedEventSubscription;
    subscription = new BufferedEventSubscription(
      () => this.subscribers.delete(subscription),
      () =>
        this.logger.warn(
          'Closed a slow domain-event subscriber after its buffer overflowed.',
        ),
    );
    this.subscribers.add(subscription);
    return subscription;
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    for (const subscriber of [...this.subscribers]) {
      subscriber.complete();
    }
    this.subscribers.clear();
  }
}

class BufferedEventSubscription implements ClosableAsyncIterator<DomainEvent> {
  private readonly queue: DomainEvent[] = [];
  private readonly waiting: PendingNext[] = [];
  private failure: Error | null = null;
  private finished = false;

  constructor(
    private readonly onClose: () => void,
    private readonly onOverflow: () => void,
  ) {}

  [Symbol.asyncIterator](): AsyncIterableIterator<DomainEvent> {
    return this;
  }

  push(event: DomainEvent): void {
    if (this.finished) {
      return;
    }

    const pending = this.waiting.shift();
    if (pending) {
      pending.resolve({ done: false, value: event });
      return;
    }

    if (this.queue.length >= MAX_BUFFERED_EVENTS_PER_SUBSCRIBER) {
      this.onOverflow();
      this.fail(new Error('Subscription event buffer overflowed.'));
      return;
    }

    this.queue.push(event);
  }

  next(): Promise<IteratorResult<DomainEvent>> {
    const queued = this.queue.shift();
    if (queued) {
      return Promise.resolve({ done: false, value: queued });
    }

    if (this.failure) {
      return Promise.reject(this.failure);
    }

    if (this.finished) {
      return Promise.resolve({ done: true, value: undefined });
    }

    return new Promise<IteratorResult<DomainEvent>>((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  return(): Promise<IteratorResult<DomainEvent>> {
    this.complete();
    return Promise.resolve({ done: true, value: undefined });
  }

  throw(error?: unknown): Promise<IteratorResult<DomainEvent>> {
    const failure =
      error instanceof Error ? error : new Error('Subscription terminated.');
    this.fail(failure);
    return Promise.reject(failure);
  }

  complete(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.queue.length = 0;
    for (const pending of this.waiting.splice(0)) {
      pending.resolve({ done: true, value: undefined });
    }
    this.onClose();
  }

  private fail(error: Error): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.failure = error;
    this.queue.length = 0;
    for (const pending of this.waiting.splice(0)) {
      pending.reject(error);
    }
    this.onClose();
  }
}

function completedIterator(): ClosableAsyncIterator<DomainEvent> {
  return {
    [Symbol.asyncIterator](): AsyncIterableIterator<DomainEvent> {
      return this;
    },
    next: () => Promise.resolve({ done: true, value: undefined }),
    return: () => Promise.resolve({ done: true, value: undefined }),
  };
}
