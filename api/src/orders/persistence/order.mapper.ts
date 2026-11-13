import { OrderInputError } from '../domain/order-input.error';
import { toPublicOrderStatus } from '../domain/order-status';
import type { CookedOrderOfferModel } from '../models/cooked-order-offer.model';
import type { OrderModel } from '../models/order.model';
import type { AvailableCookedOrderRecord, OrderRecord } from './order.selects';
import { parseSelectedOptionsSnapshot } from './selected-options-json';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class OrderMapper {
  private readonly logger = new Logger(OrderMapper.name);

  toModel(order: OrderRecord): OrderModel {
    return {
      id: order.id,
      status: toPublicOrderStatus(order.status),
      totalMinor: order.totalMinor,
      version: order.version,
      customer: { ...order.customer },
      courier: order.courier ? { ...order.courier } : null,
      restaurant: { ...order.restaurant },
      items: order.items.map((item) => {
        try {
          return {
            id: item.id,
            dishId: item.dishId,
            dishName: item.dishName,
            basePriceMinor: item.basePriceMinor,
            selectedOptions: parseSelectedOptionsSnapshot(item.selectedOptions),
            optionsExtraMinor: item.optionsExtraMinor,
            lineTotalMinor: item.lineTotalMinor,
          };
        } catch (error) {
          if (!(error instanceof OrderInputError)) {
            throw error;
          }
          this.logger.error(
            `Invalid persisted selected options for order item ${item.id}.`,
          );
          throw new InternalServerErrorException('Order data is unavailable.');
        }
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  toCookedOrderOffer(order: AvailableCookedOrderRecord): CookedOrderOfferModel {
    return {
      id: order.id,
      status: toPublicOrderStatus(order.status),
      version: order.version,
      restaurant: { ...order.restaurant },
      createdAt: order.createdAt,
    };
  }
}
