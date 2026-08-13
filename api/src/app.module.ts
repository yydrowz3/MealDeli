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
import { JwtModule } from "@nestjs/jwt";
import { MailsModule } from "./mails/mails.module";
import { ACCESS_TOKEN_EXPIRES_IN } from "./auth/auth.constants";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { PaymentsModule } from './payments/payments.module';

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
          onConnect: (context: any) => {
            const { connectionParams, extra } = context;
            if (connectionParams && connectionParams.authorization) {
              const [type, token] = connectionParams.authorization.split(" ");
              if (type === "Bearer" && token) {
                extra.token = token;
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
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
