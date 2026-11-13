import { CLOCK, type Clock } from '@/common/time/clock';
import { EnvironmentVariables } from '@/config/environment.variables';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '@/events/domain-event-bus.port';
import { createPromotionExpiredEvent } from '../domain/promotion-event';
import { PromotionExpiryRepository } from '../persistence/promotion-expiry.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PromotionExpiryService {
  private readonly logger = new Logger(PromotionExpiryService.name);
  private readonly batchSize: number;
  private readonly maxBatches: number;

  constructor(
    private readonly promotions: PromotionExpiryRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    @Inject(CLOCK)
    private readonly clock: Clock,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.batchSize = config.get('PROMOTION_EXPIRY_BATCH_SIZE', { infer: true });
    this.maxBatches = config.get('PROMOTION_EXPIRY_MAX_BATCHES', {
      infer: true,
    });
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'promotion-expiry',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async expirePromotions(): Promise<void> {
    const evaluatedAt = this.clock.now();
    let expiredCount = 0;

    for (let batch = 0; batch < this.maxBatches; batch += 1) {
      const expired = await this.promotions.expireBatch(
        evaluatedAt,
        this.batchSize,
      );
      expiredCount += expired.length;

      for (const fact of expired) {
        const event = createPromotionExpiredEvent(fact, evaluatedAt);
        try {
          this.events.publish(event);
        } catch (error) {
          this.logger.error(
            `Domain event ${event.eventId} failed after promotion expiry.`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      if (expired.length < this.batchSize) {
        break;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} restaurant promotions.`);
    }
  }
}
