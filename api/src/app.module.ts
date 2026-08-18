import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { CommonModule } from "./common/common.module";
import { join } from "node:path";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtModule, type JwtSignOptions } from "@nestjs/jwt";
import { MailsModule } from "./mails/mails.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { PaymentsModule } from "./payments/payments.module";
import { UploadsModule } from "./uploads/uploads.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      graphiql: true,
      subscriptions: {
        "graphql-ws": {
          onConnect: async (context: any) => {
            const authorization =
              context.connectionParams?.authorization ?? context.connectionParams?.Authorization;
            if (typeof authorization === "string") {
              const [type, token] = authorization.trim().split(/\s+/);
              if (type.toLowerCase() === "bearer" && token) {
                context.extra.token = token;
              }
            }
          },
        },
      },
      context: ({ req, res, extra }: { req: any; res: any; extra: any }) => {
        let token: string | undefined;
        if (extra?.token) {
          token = extra.token;
        } else if (req?.headers.authorization) {
          const [type, value] = req.headers.authorization.split(" ");
          if (type === "Bearer" && value) {
            token = value;
          }
        }
        return {
          req,
          res,
          token,
        };
      },
    }),
    PrismaModule,
    UsersModule,
    CommonModule,
    AuthModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const issuer = configService.getOrThrow<string>("JWT_ISSUER");
        const audience = configService.getOrThrow<string>("JWT_AUDIENCE");
        return {
          secret: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
          signOptions: {
            algorithm: "HS256",
            expiresIn:
              configService.getOrThrow<JwtSignOptions["expiresIn"]>("JWT_ACCESS_EXPIRES_IN"),
            issuer,
            audience,
          },
          verifyOptions: {
            algorithms: ["HS256"],
            issuer,
            audience,
          },
        };
      },
    }),
    MailsModule,
    RestaurantsModule,
    PaymentsModule,
    UploadsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
