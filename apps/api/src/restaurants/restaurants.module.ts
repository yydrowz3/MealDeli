import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsResolver } from './restaurants.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CategoryResolver } from './category.resolver';
import { DishResolver } from './dish.resolver';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    RestaurantsResolver,
    RestaurantsService,
    CategoryResolver,
    DishResolver,
  ],
})
export class RestaurantsModule {}
