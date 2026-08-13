import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { PrismaModule } from "../prisma/prisma.module";
import { MailsModule } from "../mails/mails.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [PrismaModule, MailsModule, ConfigModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
