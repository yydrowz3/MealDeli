import { Module } from "@nestjs/common";
import {
    CategoryResolver,
    DishResolver,
    RestaurantResolver,
} from "./restaurants.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurants.service";
// import { CategoryRepository } from "./repositories/category.repository";
import { Dish } from "./entities/dish.entity";
import { Category } from "./entities/category.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Dish, Category])],
    providers: [
        RestaurantResolver,
        CategoryResolver,
        RestaurantService,
        DishResolver,
    ],
})
export class RestaurantsModule {}
