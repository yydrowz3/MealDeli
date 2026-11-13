import { AccessTokenService } from '@/auth/access-token.service';
import { AuthResolver } from '@/auth/auth.resolver';
import { AuthService } from '@/auth/auth.service';
import { CredentialsRepository } from '@/auth/credentials.repository';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { GqlThrottlerGuard } from '@/auth/gql-throttler.guard';
import { GraphqlContextFactory } from '@/auth/graphql-context.factory';
import { HttpAuthGuard } from '@/auth/http-auth.guard';
import { PasswordHasherService } from '@/auth/password-hasher.service';
import { RolesGuard } from '@/auth/roles.guard';
import type { EnvironmentVariables } from '@/config/environment.variables';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'identity',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    CredentialsRepository,
    PasswordHasherService,
    AccessTokenService,
    GraphqlContextFactory,
    GqlAuthGuard,
    HttpAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
  exports: [
    PasswordHasherService,
    AccessTokenService,
    GraphqlContextFactory,
    GqlAuthGuard,
    HttpAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
