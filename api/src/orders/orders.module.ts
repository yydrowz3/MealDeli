import { AuthModule } from '@/auth/auth.module';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { OrderCommandService } from './application/order-command.service';
import { OrderQueryService } from './application/order-query.service';
import { OrderSubscriptionService } from './application/order-subscription.service';
import { OrdersSubscriptionResolver } from './orders-subscription.resolver';
import { OrdersResolver } from './orders.resolver';
import { OrderMapper } from './persistence/order.mapper';
import { OrderRepository } from './persistence/order.repository';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule],
  providers: [
    OrdersResolver,
    OrdersSubscriptionResolver,
    OrderCommandService,
    OrderQueryService,
    OrderSubscriptionService,
    OrderRepository,
    OrderMapper,
  ],
})
export class OrdersModule {}
