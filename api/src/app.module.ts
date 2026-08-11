import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { CommonModule } from "./common/common.module";
import { join } from "node:path";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "./jwt/jwt.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      graphiql: true,
      subscriptions: {
        "graphql-ws": true,
      },
    }),
    PrismaModule,
    UsersModule,
    CommonModule,
    AuthModule,
    JwtModule.forRoot({
      privateKey: String(process.env.JWT_SECRET),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
