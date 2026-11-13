import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { PaymentQueryService } from './application/payment-query.service';
import { PromotionCheckoutService } from './application/promotion-checkout.service';
import { PromotionCheckoutError } from './domain/promotion-checkout.result';
import { MyPaymentsInput, MyPaymentsPayload } from './dto/payment-query.dto';
import {
  CreatePromotionCheckoutInput,
  CreatePromotionCheckoutPayload,
} from './dto/promotion-checkout.dto';
import { PaymentModel } from './models/payment.model';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Resolver(() => PaymentModel)
export class PaymentsResolver {
  constructor(
    private readonly checkouts: PromotionCheckoutService,
    private readonly queries: PaymentQueryService,
  ) {}

  @Mutation(() => CreatePromotionCheckoutPayload)
  async createPromotionCheckout(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: CreatePromotionCheckoutInput,
  ): Promise<CreatePromotionCheckoutPayload> {
    const result = await this.checkouts.create(principal, input.restaurantId);
    if (result.ok) {
      return {
        ok: true,
        transactionId: result.transactionId,
      };
    }

    return {
      ok: false,
      error: checkoutErrorMessage(result.error),
    };
  }

  @Query(() => MyPaymentsPayload)
  async myPayments(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input', {
      type: () => MyPaymentsInput,
      defaultValue: { page: 1 },
    })
    input: MyPaymentsInput,
  ): Promise<MyPaymentsPayload> {
    const page = await this.queries.myPayments(principal, input.page);
    return {
      ok: true,
      payments: page.results,
      totalResults: page.totalResults,
      totalPages: page.totalPages,
    };
  }
}

function checkoutErrorMessage(error: PromotionCheckoutError): string {
  switch (error) {
    case PromotionCheckoutError.ResourceUnavailable:
      return 'Resource is unavailable.';
    case PromotionCheckoutError.ProviderUnavailable:
      return 'Payment checkout is temporarily unavailable.';
  }
}
