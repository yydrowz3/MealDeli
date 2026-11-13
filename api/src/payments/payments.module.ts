import { AuthModule } from '@/auth/auth.module';
import { TimeModule } from '@/common/time/time.module';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaymentQueryService } from './application/payment-query.service';
import { PaymentWebhookService } from './application/payment-webhook.service';
import { PromotionCheckoutService } from './application/promotion-checkout.service';
import { PromotionExpiryService } from './application/promotion-expiry.service';
import { PAYMENT_PROVIDER } from './integrations/payment-provider.port';
import { PaddlePaymentProvider } from './integrations/paddle-payment.provider';
import { PaddleWebhookController } from './paddle-webhook.controller';
import { PaymentMapper } from './persistence/payment.mapper';
import { PaymentRepository } from './persistence/payment.repository';
import { PromotionCheckoutRepository } from './persistence/promotion-checkout.repository';
import { PromotionExpiryRepository } from './persistence/promotion-expiry.repository';
import { PaymentsResolver } from './payments.resolver';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule, TimeModule],
  controllers: [PaddleWebhookController],
  providers: [
    PaymentsResolver,
    PromotionCheckoutService,
    PaymentQueryService,
    PaymentWebhookService,
    PromotionExpiryService,
    PromotionCheckoutRepository,
    PaymentRepository,
    PromotionExpiryRepository,
    PaymentMapper,
    PaddlePaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: PaddlePaymentProvider,
    },
  ],
})
export class PaymentsModule {}
