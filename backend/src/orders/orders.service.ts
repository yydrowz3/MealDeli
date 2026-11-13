import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User, UserRole } from "src/users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Dish } from "src/restaurants/entities/dish.entity";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import {
    NEW_COOKED_ORDER,
    NEW_ORDER_UPDATE,
    NEW_PENDING_ORDER,
    PUB_SUB,
} from "src/common/common.constants";
import { PubSub } from "graphql-subscriptions";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private readonly orders: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
        @Inject(PUB_SUB) private readonly pubSub: PubSub
    ) {}

    async createOrder(
        customer: User,
        { restaurantId, items }: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            let orderFinalPrice = 0;
            const orderItems: OrderItem[] = [];
            for (const item of items) {
                const dish = await this.dishes.findOne({
                    where: { id: item.dishId },
                });
                if (!dish) {
                    return {
                        ok: false,
                        error: "Dish not found",
                    };
                    // abort this whole thing
                }
                let dishFinalPrice = dish.price;
                if (item.options) {
                    for (const itemOption of item.options) {
                        const dishOption = dish.options?.find(
                            (dishOption) => dishOption.name === itemOption.name
                        );
                        if (dishOption) {
                            if (dishOption.extra) {
                                dishFinalPrice =
                                    dishFinalPrice + dishOption.extra;
                            } else {
                                const dishOptionChoice =
                                    dishOption.choices?.find(
                                        (optionChoice) =>
                                            optionChoice.name ===
                                            itemOption.name
                                    );
                                if (dishOptionChoice) {
                                    if (dishOptionChoice.extra) {
                                        dishFinalPrice =
                                            dishFinalPrice +
                                            dishOptionChoice.extra;
                                    }
                                }
                            }
                        }
                    }
                }
                orderFinalPrice = orderFinalPrice + dishFinalPrice;
                const orderItem = await this.orderItems.save(
                    this.orderItems.create({
                        dish: dish,
                        options: item.options,
                    })
                );
                orderItems.push(orderItem);
            }

            const order = await this.orders.save(
                this.orders.create({
                    customer: customer,
                    restaurant: restaurant,
                    total: orderFinalPrice,
                    items: orderItems,
                })
            );
            await this.pubSub.publish(NEW_PENDING_ORDER, {
                pendingOrders: { order, ownerId: restaurant.ownerId },
            });

            return {
                ok: true,
                orderId: order.id,
            };
        } catch {
            return {
                ok: false,
                error: "Could not create order",
            };
        }
    }

    async getOrders(
        user: User,
        { status }: GetOrdersInput
    ): Promise<GetOrdersOutput> {
        try {
            let orders: Order[];
            if (user.role === UserRole.Client) {
                orders = await this.orders.find({
                    where: {
                        customer: { id: user.id },
                        ...(status && { status }),
                    }, // add a property to an object conditionally
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.orders.find({
                    where: {
                        driver: { id: user.id },
                        ...(status && { status }),
                    },
                });
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurants.find({
                    where: { owner: { id: user.id } },
                    // select: ["orders"],  // cannot do select cuz it is not a column
                    relations: ["orders"],
                });
                orders = restaurants
                    .map((restaurant) => restaurant.orders)
                    .flat(1);
                if (status) {
                    orders = orders.filter((order) => order.status === status);
                }
            } else {
                return {
                    ok: false,
                    error: "User role not allowed",
                };
            }

            return {
                ok: true,
                orders: orders,
            };
        } catch {
            return {
                ok: false,
                error: "Could not get orders",
            };
        }
    }

    canSeeOrder(user: User, order: Order): boolean {
        let canSee = true;
        if (user.role === UserRole.Client && order.custormerId !== user.id) {
            canSee = false;
        }
        if (user.role === UserRole.Delivery && order.driverId !== user.id) {
            canSee = false;
        }
        if (
            user.role === UserRole.Owner &&
            order.restaurant?.ownerId !== user.id
        ) {
            canSee = false;
        }
        return canSee;
    }

    async getOrder(
        user: User,
        { id: orderId }: GetOrderInput
    ): Promise<GetOrderOutput> {
        try {
            const order = await this.orders.findOne({
                where: { id: orderId },
                relations: ["restaurant"],
            });
            if (!order) {
                return {
                    ok: false,
                    error: "Order not found",
                };
            }
            if (!this.canSeeOrder(user, order)) {
                return {
                    ok: false,
                    error: "You can't get orders you don't own.",
                };
            }
            return {
                ok: true,
                order: order,
            };
        } catch {
            return {
                ok: false,
                error: "Could not get order",
            };
        }
    }

    async editOrder(
        user: User,
        { id: orderId, status }: EditOrderInput
    ): Promise<EditOrderOutput> {
        try {
            const order = await this.orders.findOne({
                where: { id: orderId },
                relations: ["restaurant", "customer", "driver"],
            });
            if (!order) {
                return {
                    ok: false,
                    error: "Order not found",
                };
            }
            if (!this.canSeeOrder(user, order)) {
                return {
                    ok: false,
                    error: "You can't access edit orders you don't own.",
                };
            }
            let canEdit = true;
            if (user.role === UserRole.Client) {
                canEdit = false;
            }
            if (user.role == UserRole.Owner) {
                if (
                    status !== OrderStatus.Cooking &&
                    status !== OrderStatus.Cooked
                ) {
                    canEdit = false;
                }
            }
            if (user.role === UserRole.Delivery) {
                if (
                    status !== OrderStatus.PickedUp &&
                    status !== OrderStatus.Delivered
                ) {
                    canEdit = false;
                }
            }
            if (!canEdit) {
                return {
                    ok: false,
                    error: "You can't edit orders you don't own.",
                };
            }
            await this.orders.save({
                id: orderId,
                status: status,
            });

            const newOrder = { ...order, status };

            if (user.role === UserRole.Owner) {
                if (status === OrderStatus.Cooked) {
                    await this.pubSub.publish(NEW_COOKED_ORDER, {
                        cookedOrders: newOrder,
                    });
                }
            }
            await this.pubSub.publish(NEW_ORDER_UPDATE, {
                orderUpdates: newOrder,
            });

            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not edit order",
            };
        }
    }

    async takeOrder(
        driver: User,
        { id: orderId }: TakeOrderInput
    ): Promise<TakeOrderOutput> {
        try {
            const order = await this.orders.findOne({ where: { id: orderId } });
            if (!order) {
                return {
                    ok: false,
                    error: "Order not found",
                };
            }
            if (order.driver) {
                return {
                    ok: false,
                    error: "This order already has a driver",
                };
            }
            await this.orders.save({
                id: orderId,
                driver,
            });
            await this.pubSub.publish(NEW_ORDER_UPDATE, {
                orderUpdates: { ...order, driver },
            });
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not take order",
            };
        }
    }

    // async orderUpdatesUserVerify(
    //     user: User,
    //     { id: orderId }: OrderUpdatesInput
    // ) {
    //     const order = await this.orders.findOne({ where: { id: orderId } });
    //     if (!order) {
    //         return {
    //             ok: false,
    //             error: "Order not found",
    //         };
    //     }
    //     if (!this.canSeeOrder(user, order)) {
    //         return {
    //             ok: false,
    //             error: "You can't access edit orders you don't own.",
    //         };
    //     }
    //     return {
    //         ok: true,
    //     };
    // }
}
