import { AccessTokenService } from '@/auth/access-token.service';
import { extractBearerToken } from '@/auth/bearer-token';
import type { AuthenticatedHttpRequest } from '@/auth/http-authenticated-request';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>();
    const accessToken = extractBearerToken(request);
    const session = await this.accessTokens.verifySession(accessToken);

    request.principal = session.principal;
    request.accessTokenExpiresAtEpochSeconds = session.expiresAtEpochSeconds;
    return true;
  }
}
