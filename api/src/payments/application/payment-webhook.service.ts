import { CLOCK, type Clock } from '@/common/time/clock';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '@/events/domain-event-bus.port';
import { createPromotionActivatedEvent } from '../domain/promotion-event';
import {
  PAYMENT_PROVIDER,
  type PaymentProviderPort,
} from '../integrations/payment-provider.port';
import { PaymentRepository } from '../persistence/payment.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,
    private readonly payments: PaymentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async handle(rawBody: Buffer, signature: string): Promise<void> {
    const verified = await this.provider.verifyWebhook(rawBody, signature);

    if (verified.kind === 'ignored') {
      return;
    }

    if (verified.kind === 'rejected') {
      this.logger.warn(
        `Rejected verified payment event ${verified.providerEventId}: ${verified.reason}.`,
      );
      return;
    }

    const receivedAt = this.clock.now();
    const result = await this.payments.applyPromotionPayment(
      verified,
      receivedAt,
    );

    if (result.kind === 'rejected') {
      this.logger.warn(
        `Rejected promotion event ${verified.providerEventId}: ${result.reason}.`,
      );
      return;
    }

    if (result.kind === 'replayed') {
      return;
    }

    const event = createPromotionActivatedEvent(result.fact, receivedAt);
    try {
      this.events.publish(event);
    } catch (error) {
      this.logger.error(
        `Domain event ${event.eventId} failed after the payment commit.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
