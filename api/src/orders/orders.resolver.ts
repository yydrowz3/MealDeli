import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { OrderCommandService } from './application/order-command.service';
import { OrderQueryService } from './application/order-query.service';
import { orderErrorMessage } from './domain/order-result';
import {
  CreateOrderInput,
  CreateOrderPayload,
  EditOrderInput,
  OrderOperationPayload,
  TakeOrderInput,
} from './dto/order-command.dto';
import {
  GetOrderInput,
  GetOrderPayload,
  GetOrdersInput,
  GetOrdersPayload,
} from './dto/order-query.dto';
import { OrderModel } from './models/order.model';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@UseGuards(GqlAuthGuard, RolesGuard)
@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(
    private readonly commands: OrderCommandService,
    private readonly queries: OrderQueryService,
  ) {}

  @Roles(UserRole.CUSTOMER)
  @Mutation(() => CreateOrderPayload)
  async createOrder(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: CreateOrderInput,
  ): Promise<CreateOrderPayload> {
    const result = await this.commands.create(principal, input);
    return result.ok
      ? {
          ok: true,
          orderId: result.value.orderId,
          replayed: result.replayed,
        }
      : {
          ok: false,
          error: orderErrorMessage(result.error),
          replayed: false,
        };
  }

  @Roles(UserRole.CUSTOMER, UserRole.OWNER, UserRole.COURIER)
  @Query(() => GetOrderPayload)
  async getOrder(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: GetOrderInput,
  ): Promise<GetOrderPayload> {
    const order = await this.queries.getOrder(principal, input.orderId);
    return order
      ? { ok: true, order }
      : {
          ok: false,
          error: 'Resource is unavailable.',
        };
  }

  @Roles(UserRole.CUSTOMER, UserRole.OWNER, UserRole.COURIER)
  @Query(() => GetOrdersPayload)
  async getOrders(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input', {
      type: () => GetOrdersInput,
      defaultValue: { page: 1 },
    })
    input: GetOrdersInput,
  ): Promise<GetOrdersPayload> {
    const page = await this.queries.getOrders(
      principal,
      input.status ?? undefined,
      input.page,
    );
    return {
      ok: true,
      orders: page.results,
      totalResults: page.totalResults,
      totalPages: page.totalPages,
    };
  }

  @Roles(UserRole.OWNER, UserRole.COURIER)
  @Mutation(() => OrderOperationPayload)
  async editOrder(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: EditOrderInput,
  ): Promise<OrderOperationPayload> {
    const result = await this.commands.edit(
      principal,
      input.orderId,
      input.status,
    );
    return result.ok
      ? { ok: true, replayed: result.replayed }
      : {
          ok: false,
          error: orderErrorMessage(result.error),
          replayed: false,
        };
  }

  @Roles(UserRole.COURIER)
  @Mutation(() => OrderOperationPayload)
  async takeOrder(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: TakeOrderInput,
  ): Promise<OrderOperationPayload> {
    const result = await this.commands.take(principal, input.orderId);
    return result.ok
      ? { ok: true, replayed: result.replayed }
      : {
          ok: false,
          error: orderErrorMessage(result.error),
          replayed: false,
        };
  }
}
