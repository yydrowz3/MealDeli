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
import { MailsModule } from "./mails/mails.module";

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
      context: ({ req, extra }: { req: any; extra: any }) => {
        if (extra && extra.token) {
          return { token: extra.token };
        }
        if (req && req.headers.authorization) {
          const [type, token] = req.headers.authorization.split(" ");
          if (type === "Bearer" && token) {
            return { token };
          }
        }
      },
    }),
    PrismaModule,
    UsersModule,
    CommonModule,
    AuthModule,
    JwtModule.forRoot({
      privateKey: String(process.env.JWT_SECRET),
    }),
    MailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
