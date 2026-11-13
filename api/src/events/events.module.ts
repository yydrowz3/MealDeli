import {
  DOMAIN_EVENT_PUBLISHER,
  DOMAIN_EVENT_SOURCE,
} from './domain-event-bus.port';
import { InMemoryDomainEventBus } from './in-memory-domain-event-bus';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    InMemoryDomainEventBus,
    {
      provide: DOMAIN_EVENT_PUBLISHER,
      useExisting: InMemoryDomainEventBus,
    },
    {
      provide: DOMAIN_EVENT_SOURCE,
      useExisting: InMemoryDomainEventBus,
    },
  ],
  exports: [DOMAIN_EVENT_PUBLISHER, DOMAIN_EVENT_SOURCE],
})
export class EventsModule {}
