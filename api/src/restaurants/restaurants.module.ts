import { Module } from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";
import { RestaurantsResolver } from "./restaurants.resolver";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [RestaurantsResolver, RestaurantsService],
})
export class RestaurantsModule {}
