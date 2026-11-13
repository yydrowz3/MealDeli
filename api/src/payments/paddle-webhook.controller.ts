import { PaymentWebhookService } from './application/payment-webhook.service';
import { InvalidPaymentWebhookError } from './integrations/payment-provider.port';
import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

@Controller('payments/webhooks')
export class PaddleWebhookController {
  constructor(private readonly webhooks: PaymentWebhookService) {}

  @Post('paddle')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handlePaddleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('paddle-signature') signature: string | undefined,
  ): Promise<void> {
    if (!signature || !request.rawBody || request.rawBody.length === 0) {
      throw new BadRequestException('A signed raw webhook body is required.');
    }

    try {
      await this.webhooks.handle(request.rawBody, signature);
    } catch (error) {
      if (error instanceof InvalidPaymentWebhookError) {
        throw new BadRequestException('Webhook signature verification failed.');
      }
      throw error;
    }
  }
}
