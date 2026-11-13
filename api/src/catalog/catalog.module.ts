import { CatalogQueryService } from './application/catalog-query.service';
import { DishManagementService } from './application/dish-management.service';
import { RestaurantManagementService } from './application/restaurant-management.service';
import { CatalogQueryResolver } from './catalog-query.resolver';
import { DishManagementResolver } from './dish-management.resolver';
import { CatalogMapper } from './persistence/catalog.mapper';
import { CatalogQueryRepository } from './persistence/catalog-query.repository';
import { DishRepository } from './persistence/dish.repository';
import { RestaurantRepository } from './persistence/restaurant.repository';
import { RestaurantManagementResolver } from './restaurant-management.resolver';
import { AuthModule } from '@/auth/auth.module';
import { TimeModule } from '@/common/time/time.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, TimeModule],
  providers: [
    CatalogQueryResolver,
    RestaurantManagementResolver,
    DishManagementResolver,
    CatalogQueryService,
    RestaurantManagementService,
    DishManagementService,
    CatalogQueryRepository,
    RestaurantRepository,
    DishRepository,
    CatalogMapper,
  ],
})
export class CatalogModule {}
