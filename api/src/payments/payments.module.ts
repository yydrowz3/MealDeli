import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsResolver } from "./payments.resolver";
import { PaymentController } from "./payment.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentsResolver, PaymentsService],
})
export class PaymentsModule {}
