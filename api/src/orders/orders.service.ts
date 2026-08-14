import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PubSub } from 'graphql-subscriptions';
import { User } from '../users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { Order } from './entities/order.entity';
import { DishOption } from '../restaurants/entities/dish-option.entity';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';
import { Prisma } from '../generated/prisma/client';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { UserRole } from '../users/enums/role.enum';
import { OrderStatus } from './enums/status.enum';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { OrderUpdatesInput, OrderUpdatesOutput } from './dto/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dto/take-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.prismaService.restaurant.findUnique({
        where: {
          id: createOrderInput.restaurantId,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (createOrderInput.items.length === 0) {
        return {
          ok: false,
          error: 'Order must contain at least one item.',
        };
      }

      let orderFinalMinor = 0;
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      for (const [position, item] of createOrderInput.items.entries()) {
        const dish = await this.prismaService.dish.findUnique({
          where: {
            id: item.dishId,
          },
        });
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found.',
          };
        }

        if (dish.restaurantId !== restaurant.id) {
          return {
            ok: false,
            error: 'Dish does not belong to this restaurant.',
          };
        }

        let optionsExtraMinor = 0;
        const selectedOptions: Prisma.InputJsonValue[] = [];
        const dishOptions = Array.isArray(dish.options)
          ? (dish.options as unknown as DishOption[])
          : [];
        const selectedOptionIds = new Set(
          item.options.map((option) => option.optionId),
        );
        if (selectedOptionIds.size !== item.options.length) {
          return {
            ok: false,
            error: 'Each dish option can only be selected once.',
          };
        }

        if (
          dishOptions.some(
            (option) =>
              option.minSelections > 0 && !selectedOptionIds.has(option.id),
          )
        ) {
          return {
            ok: false,
            error: 'A required dish option is missing.',
          };
        }

        for (const itemOption of item.options) {
          const dishOption = dishOptions.find(
            (option) => option.id === itemOption.optionId,
          );
          if (!dishOption) {
            return {
              ok: false,
              error: 'Dish option not found.',
            };
          }

          const selectedChoiceIds = new Set(itemOption.choiceIds);
          if (
            selectedChoiceIds.size !== itemOption.choiceIds.length ||
            itemOption.choiceIds.length === 0 ||
            itemOption.choiceIds.length < dishOption.minSelections ||
            itemOption.choiceIds.length > dishOption.maxSelections
          ) {
            return {
              ok: false,
              error: 'Invalid number of choices for dish option.',
            };
          }

          const selectedChoices = itemOption.choiceIds.map((choiceId) => {
            const dishChoice = dishOption.choices.find(
              (choice) => choice.id === choiceId,
            );
            if (!dishChoice) {
              return null;
            }

            optionsExtraMinor += dishChoice.extraMinor;
            return {
              choiceId: dishChoice.id,
              name: dishChoice.name,
              extraMinor: dishChoice.extraMinor,
            };
          });

          if (selectedChoices.some((choice) => choice === null)) {
            return {
              ok: false,
              error: 'Dish option choice not found.',
            };
          }

          selectedOptions.push({
            optionId: dishOption.id,
            name: dishOption.name,
            choices: selectedChoices,
          });
        }

        const lineTotalMinor =
          (dish.priceMinor + optionsExtraMinor) * item.quantity;
        orderFinalMinor += lineTotalMinor;
        orderItems.push({
          position,
          dishId: dish.id,
          dishName: dish.name,
          basePriceMinor: dish.priceMinor,
          selectedOptions,
          optionsExtraMinor,
          quantity: item.quantity,
          lineTotalMinor,
        });
      }

      const order = await this.prismaService.order.create({
        data: {
          customerId: customer.id,
          restaurantId: restaurant.id,
          totalMinor: orderFinalMinor,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

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
        error: 'Could not create order.',
      };
    }
  }

  async getOrders(
    user: User,
    getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      switch (user.role) {
        case UserRole.CUSTOMER:
          orders = await this.prismaService.order.findMany({
            where: {
              customerId: user.id,
              status: getOrdersInput.status,
            },
          });
          break;
        case UserRole.COURIER:
          orders = await this.prismaService.order.findMany({
            where: {
              courierId: user.id,
              status: getOrdersInput.status,
            },
          });
          break;
        case UserRole.OWNER:
          const restaurants = await this.prismaService.restaurant.findMany({
            where: {
              ownerId: user.id,
            },
            select: {
              orders: true,
            },
          });
          orders = restaurants.flatMap((restaurant) => restaurant.orders);
          if (getOrdersInput.status) {
            orders = orders.filter(
              (order) => order.status === getOrdersInput.status,
            );
          }
          break;

        default:
          return {
            ok: false,
            error: 'User role not supported.',
          };
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get orders.',
      };
    }
  }

  private canSeeOrder(user: User, order: Order): boolean {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return order.customerId === user.id;

      case UserRole.COURIER:
        return order.courierId === user.id;

      case UserRole.OWNER:
        return order.restaurant?.ownerId === user.id;

      default:
        return false;
    }
  }

  async getOrder(
    user: User,
    getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: {
          id: getOrderInput.id,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order Not Found',
        };
      }
      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: 'Permission denied for this order',
        };
      }
      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get order.',
      };
    }
  }

  canEditOrder(user: User, status: OrderStatus): boolean {
    if (UserRole.OWNER === user.role) {
      switch (status) {
        case OrderStatus.COOKING:
        case OrderStatus.WAITING:
          return true;

        default:
          return false;
      }
    }

    if (UserRole.COURIER === user.role) {
      switch (status) {
        case OrderStatus.PICKED:
        case OrderStatus.DELIVERED:
          return true;

        default:
          return false;
      }
    }

    return false;
  }

  async editOrder(
    user: User,
    editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: {
          id: editOrderInput.id,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: 'Permission denied for this order',
        };
      }
      const canEditOrder = this.canEditOrder(user, editOrderInput.status);
      if (!canEditOrder) {
        return {
          ok: false,
          error: 'Permission denied for this order status',
        };
      }
      await this.prismaService.order.update({
        where: {
          id: editOrderInput.id,
        },
        data: {
          status: editOrderInput.status,
        },
      });

      const newOrder = { ...order, status: editOrderInput.status };
      if (UserRole.OWNER == user.role) {
        if (OrderStatus.WAITING === editOrderInput.status) {
          await this.pubSub.publish(NEW_COOKED_ORDER, {
            cookedOrder: newOrder,
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
        error: 'Could not edit order.',
      };
    }
  }

  async orderUpdatesUserCheck(
    user: User,
    orderUpdatesInput: OrderUpdatesInput,
  ): Promise<OrderUpdatesOutput> {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderUpdatesInput.id,
      },
    });
    if (!order) {
      return {
        ok: false,
        error: 'Order not found.',
      };
    }
    const canSeeOrder = this.canSeeOrder(user, order);
    if (!canSeeOrder) {
      return {
        ok: false,
        error: 'Permission denied for this order',
      };
    }
    return {
      ok: true,
    };
  }

  async takeOrder(
    courier: User,
    takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: {
          id: takeOrderInput.id,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      if (order.courierId) {
        return {
          ok: false,
          error: 'Order already taken.',
        };
      }
      await this.prismaService.order.update({
        where: {
          id: takeOrderInput.id,
        },
        data: {
          courierId: courier.id,
          status: OrderStatus.PICKED,
        },
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, courier },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not take order.',
      };
    }
  }
}
