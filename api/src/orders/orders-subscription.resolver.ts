import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import {
  type CookedOrdersPayload,
  type OrderUpdatesPayload,
  type PendingOrdersPayload,
  OrderSubscriptionService,
} from './application/order-subscription.service';
import { OrderUpdatesInput } from './dto/order-subscription.dto';
import { CookedOrderOfferModel } from './models/cooked-order-offer.model';
import { OrderModel } from './models/order.model';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Resolver, Subscription } from '@nestjs/graphql';

@UseGuards(GqlAuthGuard, RolesGuard)
@Resolver(() => OrderModel)
export class OrdersSubscriptionResolver {
  constructor(private readonly subscriptions: OrderSubscriptionService) {}

  @Roles(UserRole.OWNER)
  @Subscription(() => OrderModel, {
    resolve: (payload: PendingOrdersPayload) => payload.pendingOrders,
  })
  pendingOrders(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): AsyncIterableIterator<PendingOrdersPayload> {
    return this.subscriptions.pendingOrders(principal);
  }

  @Roles(UserRole.COURIER)
  @Subscription(() => CookedOrderOfferModel, {
    resolve: (payload: CookedOrdersPayload) => payload.cookedOrders,
  })
  cookedOrders(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): AsyncIterableIterator<CookedOrdersPayload> {
    return this.subscriptions.cookedOrders(principal);
  }

  @Roles(UserRole.CUSTOMER, UserRole.OWNER, UserRole.COURIER)
  @Subscription(() => OrderModel, {
    resolve: (payload: OrderUpdatesPayload) => payload.orderUpdates,
  })
  async orderUpdates(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: OrderUpdatesInput,
  ): Promise<AsyncIterableIterator<OrderUpdatesPayload>> {
    const stream = await this.subscriptions.orderUpdates(
      principal,
      input.orderId,
    );
    if (!stream) {
      throw new NotFoundException('Resource is unavailable.');
    }
    return stream;
  }
}
