import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenVerifier } from './access-token-verifier';

type AuthenticatedRequest = Request & { user?: unknown; sessionId?: string };

@Injectable()
export class RestAccessTokenGuard implements CanActivate {
  constructor(private readonly accessTokenVerifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request.headers.authorization);
    const verified = await this.accessTokenVerifier.verify(token);
    request.user = verified.user;
    request.sessionId = verified.sessionId;
    return true;
  }

  private readBearerToken(
    authorization: string | undefined,
  ): string | undefined {
    if (!authorization) return undefined;
    return /^Bearer\s+(\S+)$/i.exec(authorization.trim())?.[1];
  }
}
