import { Args, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { Order } from "./entities/order.entity";
import { OrderService } from "./orders.service.js";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { AuthUser } from "src/auth/auth-user.decorator";
import { User } from "src/users/entities/user.entity";
import { Role } from "src/auth/role.decorator";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { Inject } from "@nestjs/common";
import {
    NEW_COOKED_ORDER,
    NEW_ORDER_UPDATE,
    NEW_PENDING_ORDER,
    PUB_SUB,
} from "src/common/common.constants";
import { PubSub } from "graphql-subscriptions";
import { OrderUpdatesInput } from "./dtos/order-updates.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";

@Resolver((of) => Order)
export class OrderResolver {
    constructor(
        private readonly ordersService: OrderService,
        @Inject(PUB_SUB) private readonly pubSub: PubSub
    ) {}

    @Mutation((returns) => CreateOrderOutput)
    @Role(["Client"])
    createOrder(
        @AuthUser() customer: User,
        @Args("input") createOrderInput: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        return this.ordersService.createOrder(customer, createOrderInput);
    }

    @Query((returns) => GetOrdersOutput)
    @Role(["Any"])
    async getOrders(
        @AuthUser() user: User,
        @Args("input") getOrdersInput: GetOrdersInput
    ): Promise<GetOrdersOutput> {
        return this.ordersService.getOrders(user, getOrdersInput);
    }

    @Query((returns) => GetOrderOutput)
    @Role(["Any"])
    async getOrder(
        @AuthUser() user: User,
        @Args("input") getOrderInput: GetOrderInput
    ): Promise<GetOrderOutput> {
        return this.ordersService.getOrder(user, getOrderInput);
    }

    @Mutation((returns) => EditOrderOutput)
    @Role(["Delivery", "Owner"])
    async editOrder(
        @AuthUser() user: User,
        @Args("input") editOrderInput: EditOrderInput
    ): Promise<EditOrderOutput> {
        return this.ordersService.editOrder(user, editOrderInput);
    }

    @Subscription((returns) => Order, {
        filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
            return ownerId === user.id;
        },
        resolve: ({ pendingOrders: { order } }) => order,
    })
    @Role(["Owner"])
    pendingOrders() {
        return this.pubSub.asyncIterableIterator(NEW_PENDING_ORDER);
    }

    @Subscription((returns) => Order)
    @Role(["Delivery"])
    cookedOrders() {
        return this.pubSub.asyncIterableIterator(NEW_COOKED_ORDER);
    }

    @Subscription((returns) => Order, {
        filter: (
            { orderUpdates: order }: { orderUpdates: Order },
            { input }: { input: OrderUpdatesInput },
            { user }: { user: User }
        ) => {
            if (
                order.driverId !== user.id &&
                order.custormerId !== user.id &&
                order.restaurant?.ownerId !== user.id
            ) {
                return false;
            }
            return order.id === input.id;
        },
    })
    @Role(["Any"])
    orderUpdates(@Args("input") orderUpdatesInput: OrderUpdatesInput) {
        return this.pubSub.asyncIterableIterator(NEW_ORDER_UPDATE);
    }

    @Mutation((returns) => TakeOrderOutput)
    @Role(["Delivery"])
    takeOrder(
        @AuthUser() driver: User,
        @Args("input") takeOrderInput: TakeOrderInput
    ): Promise<TakeOrderOutput> {
        return this.ordersService.takeOrder(driver, takeOrderInput);
    }
}
