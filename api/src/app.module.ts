import { AuthModule } from '@/auth/auth.module';
import { GraphqlContextFactory } from '@/auth/graphql-context.factory';
import { CatalogModule } from '@/catalog/catalog.module';
import type { EnvironmentVariables } from '@/config/environment.variables';
import { validateEnvironment } from '@/config/validate-environment';
import { HealthModule } from '@/health/health.module';
import { OrdersModule } from '@/orders/orders.module';
import { PaymentsModule } from '@/payments/payments.module';
import { UploadsModule } from '@/uploads/uploads.module';
import { UsersModule } from '@/users/users.module';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ScheduleModule.forRoot(),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, AuthModule],
      inject: [ConfigService, GraphqlContextFactory],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        contexts: GraphqlContextFactory,
      ): ApolloDriverConfig => ({
        driver: ApolloDriver,
        graphiql: config.get('NODE_ENV', { infer: true }) !== 'production',
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        stopOnApplicationShutdown: true,
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            connectionInitWaitTimeout: 5_000,
            onConnect: (context: unknown) => contexts.onConnect(context),
            onSubscribe: (context: unknown) => contexts.onSubscribe(context),
            onClose: (context: unknown) => contexts.onClose(context),
          },
        },
        context: (context: unknown) => contexts.create(context),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
