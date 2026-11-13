import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, type Clock } from '@/common/time/clock';
import { UserRole } from '@/users/user-role.enum';
import {
  PromotionCheckoutError,
  PromotionCheckoutResult,
} from '../domain/promotion-checkout.result';
import {
  PAYMENT_PROVIDER,
  type PaymentProviderPort,
  PaymentProviderUnavailableError,
} from '../integrations/payment-provider.port';
import { PromotionCheckoutRepository } from '../persistence/promotion-checkout.repository';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class PromotionCheckoutService {
  private readonly logger = new Logger(PromotionCheckoutService.name);

  constructor(
    private readonly checkouts: PromotionCheckoutRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    restaurantId: string,
  ): Promise<PromotionCheckoutResult> {
    assertOwner(principal);

    const checkout = await this.checkouts.create(
      principal.userId,
      restaurantId,
    );
    if (!checkout) {
      return {
        ok: false,
        error: PromotionCheckoutError.ResourceUnavailable,
      };
    }

    let providerTransaction: { transactionId: string };
    try {
      providerTransaction = await this.provider.createPromotionTransaction(
        checkout.id,
      );
    } catch (error) {
      if (!(error instanceof PaymentProviderUnavailableError)) {
        throw error;
      }

      await this.checkouts.markFailed(checkout.id, this.clock.now());
      this.logger.warn(
        `Promotion checkout ${checkout.id} failed at the provider boundary.`,
      );
      return {
        ok: false,
        error: PromotionCheckoutError.ProviderUnavailable,
      };
    }

    const attached = await this.checkouts.attachProviderTransaction(
      checkout.id,
      providerTransaction.transactionId,
    );
    if (!attached) {
      this.logger.error(
        `Promotion checkout ${checkout.id} could not attach its provider transaction.`,
      );
      throw new InternalServerErrorException(
        'Promotion checkout is unavailable.',
      );
    }

    return {
      ok: true,
      transactionId: providerTransaction.transactionId,
    };
  }
}

function assertOwner(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.OWNER) {
    throw new ForbiddenException('Owner access is required.');
  }
}
