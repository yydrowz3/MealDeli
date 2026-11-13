import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payments.service";
import { PaymentResolver } from "./payments.resolver";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { PaymentsController } from "./payments.controller";

@Module({
    controllers: [PaymentsController],
    imports: [TypeOrmModule.forFeature([Payment, Restaurant])],
    providers: [PaymentService, PaymentResolver],
})
export class PaymentsModule {}
