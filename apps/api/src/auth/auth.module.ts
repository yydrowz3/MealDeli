import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AccessTokenVerifier } from './access-token-verifier';
import { RestAccessTokenGuard } from './rest-access-token.guard';

@Module({
  imports: [UsersModule],
  providers: [
    AccessTokenVerifier,
    RestAccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AccessTokenVerifier, RestAccessTokenGuard],
})
export class AuthModule {}
