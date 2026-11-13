import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { Request, Response } from 'express';

interface BaseGraphqlContext {
  principal?: AuthenticatedPrincipal;
  accessTokenExpiresAtEpochSeconds?: number;
}

export interface HttpGraphqlContext extends BaseGraphqlContext {
  transport: 'http';
  request: Request;
  response: Response;
}

export interface WebSocketGraphqlContext extends BaseGraphqlContext {
  transport: 'websocket';
  principal: AuthenticatedPrincipal;
  accessTokenExpiresAtEpochSeconds: number;
}

export type GraphqlContext = HttpGraphqlContext | WebSocketGraphqlContext;

export function isGraphqlSessionExpired(context: GraphqlContext): boolean {
  return (
    context.accessTokenExpiresAtEpochSeconds === undefined ||
    context.accessTokenExpiresAtEpochSeconds <= Math.floor(Date.now() / 1_000)
  );
}
