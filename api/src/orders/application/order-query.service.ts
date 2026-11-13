import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { PageResult } from '@/common/pagination/page.types';
import type { OrderStatus } from '../domain/order-status';
import type { CookedOrderOfferModel } from '../models/cooked-order-offer.model';
import type { OrderModel } from '../models/order.model';
import { OrderMapper } from '../persistence/order.mapper';
import { OrderRepository } from '../persistence/order.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderQueryService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly mapper: OrderMapper,
  ) {}

  async getOrder(
    principal: AuthenticatedPrincipal,
    orderId: string,
  ): Promise<OrderModel | null> {
    const order = await this.orders.findScoped(principal, orderId);
    return order ? this.mapper.toModel(order) : null;
  }

  async getAvailableCookedOrder(
    orderId: string,
  ): Promise<CookedOrderOfferModel | null> {
    const order = await this.orders.findAvailableCooked(orderId);
    return order ? this.mapper.toCookedOrderOffer(order) : null;
  }

  async getOrders(
    principal: AuthenticatedPrincipal,
    status: OrderStatus | undefined,
    page: number,
  ): Promise<PageResult<OrderModel>> {
    const result = await this.orders.listScoped(principal, status, page);
    return {
      ...result,
      results: result.results.map((order) => this.mapper.toModel(order)),
    };
  }
}
