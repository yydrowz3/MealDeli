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

type OrderOptionSnapshot = {
  name: string;
  extraMinor?: number;
  choices?: OrderOptionChoiceSnapshot[];
};

type OrderOptionChoiceSnapshot = {
  name: string;
  extraMinor?: number;
};

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

      let orderFinalMinor = 0;
      const orderItems: Array<{
        position: number;
        dishId: string;
        dishName: string;
        basePriceMinor: number;
        selectedOptions: Prisma.InputJsonValue;
        optionsExtraMinor: number;
        quantity: number;
        lineTotalMinor: number;
      }> = [];
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
        const selectedOptions: OrderOptionSnapshot[] = [];
        const dishOptions = Array.isArray(dish.options)
          ? (dish.options as unknown as DishOption[])
          : [];
        for (const itemOption of item.options) {
          const dishOption = dishOptions.find(
            (option) => option.name === itemOption.name,
          );
          if (!dishOption) {
            continue;
          }

          if (dishOption.extraMinor !== undefined) {
            optionsExtraMinor += dishOption.extraMinor;
            selectedOptions.push({
              name: dishOption.name,
              extraMinor: dishOption.extraMinor,
            });
            continue;
          }

          const selectedChoices: OrderOptionChoiceSnapshot[] = [];
          for (const itemChoice of itemOption.choices ?? []) {
            const dishChoice = dishOption.choices?.find(
              (choice) => choice.name === itemChoice.name,
            );
            if (!dishChoice) {
              continue;
            }

            if (dishChoice.extraMinor !== undefined) {
              optionsExtraMinor += dishChoice.extraMinor;
            }
            selectedChoices.push({
              name: dishChoice.name,
              ...(dishChoice.extraMinor !== undefined && {
                extraMinor: dishChoice.extraMinor,
              }),
            });
          }

          if (selectedChoices.length > 0) {
            selectedOptions.push({
              name: dishOption.name,
              choices: selectedChoices,
            });
          }
        }

        const lineTotalMinor = dish.priceMinor + optionsExtraMinor;
        orderFinalMinor += lineTotalMinor;
        orderItems.push({
          position,
          dishId: dish.id,
          dishName: dish.name,
          basePriceMinor: dish.priceMinor,
          selectedOptions,
          optionsExtraMinor,
          quantity: 1,
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
