import {
  Resolver,
  Query,
  Mutation,
  Args,
  Parent,
  ResolveField,
  Subscription,
} from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { Inject } from '@nestjs/common';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../users/enums/role.enum';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { OrderUpdatesInput } from './dto/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dto/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @ResolveField(() => [OrderItem])
  items(@Parent() order: Order): Promise<OrderItem[]> {
    return this.ordersService.findItemsByOrderId(order.id);
  }

  @ResolveField(() => Restaurant)
  restaurant(@Parent() order: Order): Promise<Restaurant> {
    return this.ordersService.findRestaurantById(order.restaurantId);
  }

  @Mutation(() => CreateOrderOutput)
  @Roles(UserRole.CUSTOMER)
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Roles('Any')
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, getOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Roles('Any')
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
  @Roles(UserRole.COURIER, UserRole.OWNER)
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  @Subscription(() => Order, {
    filter: (
      { pendingOrders }: { pendingOrders: { ownerId: string; order: Order } },
      _variables: unknown,
      { user }: { user: User },
    ) => {
      return pendingOrders.ownerId === user.id;
    },
    resolve: ({ pendingOrders }: { pendingOrders: { order: Order } }) =>
      pendingOrders.order,
  })
  @Roles(UserRole.OWNER)
  pendingOrders() {
    return this.pubSub.asyncIterableIterator(NEW_PENDING_ORDER);
  }

  @Subscription(() => Order)
  @Roles(UserRole.COURIER)
  cookedOrders() {
    return this.pubSub.asyncIterableIterator(NEW_COOKED_ORDER);
  }

  @Subscription(() => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (
        order.courierId !== user.id &&
        order.customerId != user.id &&
        order.restaurant?.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === input.id;
    },
  })
  @Roles('Any')
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    void orderUpdatesInput;
    return this.pubSub.asyncIterableIterator(NEW_ORDER_UPDATE);
  }

  @Mutation(() => TakeOrderOutput)
  @Roles(UserRole.COURIER)
  takeOrder(
    @AuthUser() courier: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.ordersService.takeOrder(courier, takeOrderInput);
  }
}
