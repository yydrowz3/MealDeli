import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { UsersModule } from "./users/users.module";
import { CommonModule } from "./common/common.module";
import { User } from "./users/entities/user.entity";
import { JwtModule } from "./jwt/jwt.module";
import { AuthModule } from "./auth/auth.module";
import { Verification } from "./users/entities/verification.entity";
import { MailModule } from "./mail/mail.module";
import { Restaurant } from "./restaurants/entities/restaurant.entity";
import { Category } from "./restaurants/entities/category.entity";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { Dish } from "./restaurants/entities/dish.entity";
import { OrdersModule } from "./orders/orders.module";
import { Order } from "./orders/entities/order.entity";
import { OrderItem } from "./orders/entities/order-item.entity";
import { PaymentsModule } from "./payments/payments.module";
import { Payment } from "./payments/entities/payment.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { UploadsModule } from "./uploads/uploads.module";
import { AppController } from "./app.controller";

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), "src/schema.gql"),
            sortSchema: true,
            graphiql: process.env.NODE_ENV !== "prod",
            // context: ({ req }) => ({ user: req["user"] }), // 把req中的user添加到gql中，req不再使用
            installSubscriptionHandlers: true,
            subscriptions: {
                "graphql-ws": {
                    onConnect: (context: any) => {
                        const { connectionParams, extra } = context;
                        if (!connectionParams || !connectionParams["x-jwt"]) {
                            console.log("no token");
                        } else {
                            extra.token = connectionParams["x-jwt"];
                        }
                    },
                },
            },
            context: ({ req, connection }) => {
                const TOKEN_KEY = "x-jwt";
                return {
                    token: req
                        ? req.headers[TOKEN_KEY]
                        : connection.context[TOKEN_KEY],
                };
                // return { user: req["user"] };
            },
        }),
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid("dev", "prod", "test").required(),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().required(),
                PRIVATE_KEY: Joi.string().required(),
                MAILGUN_API_KEY: Joi.string().required(),
                MAILGUN_DOMAIN_NAME: Joi.string().required(),
            }),
            isGlobal: true,
            // envFilePath: ".env.dev",
            envFilePath: ".env",
            // process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
            // ignoreEnvFile: process.env.NODE_ENV === "prod",
        }),
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: String(process.env.DB_USERNAME),
            password: String(process.env.DB_PASSWORD),
            database: process.env.DB_NAME,
            synchronize: process.env.NODE_ENV !== "prod",
            logging:
                process.env.NODE_ENV !== "prod" &&
                process.env.NODE_ENV !== "test",
            entities: [
                User,
                Verification,
                Restaurant,
                Category,
                Dish,
                Order,
                OrderItem,
                Payment,
            ],
        }),
        MailModule.forRoot({
            apiKey: String(process.env.MAILGUN_API_KEY),
            domain: String(process.env.MAILGUN_DOMAIN_NAME),
        }),
        AuthModule,
        UsersModule,
        RestaurantsModule,
        JwtModule.forRoot({
            privateKey: String(process.env.PRIVATE_KEY),
        }),
        OrdersModule,
        CommonModule,
        PaymentsModule,
        ScheduleModule.forRoot(),
        UploadsModule,
    ],
    controllers: [AppController],
    providers: [],
})
// export class AppModule implements NestModule {
//     configure(consumer: MiddlewareConsumer) {
//         consumer.apply(JwtMiddleware).forRoutes({
//             path: "/graphql",
//             method: RequestMethod.POST,
//         });
//     }

//     // for certain routes, can define as this
//     // if for all routes, can define at the main.ts with app.use(middleware) (only functional)
// }
export class AppModule {}
