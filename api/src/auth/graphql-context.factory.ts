import { AccessTokenService } from '@/auth/access-token.service';
import type { AuthenticatedSession } from '@/auth/auth-principal';
import { extractBearerTokenFromConnectionParams } from '@/auth/bearer-token';
import type {
  GraphqlContext,
  HttpGraphqlContext,
  WebSocketGraphqlContext,
} from '@/auth/graphql-context';
import { EnvironmentVariables } from '@/config/environment.variables';
import {
  Injectable,
  type OnApplicationShutdown,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CloseCode } from 'graphql-ws';

const ACCESS_TOKEN_EXPIRED_REASON = 'Access token expired.';

interface WebSocketAuthState {
  extra: object;
  session: AuthenticatedSession;
  expiryTimer: NodeJS.Timeout;
}

interface ClosableSocket {
  close(code: number, reason: string): void;
}

@Injectable()
export class GraphqlContextFactory implements OnApplicationShutdown {
  private readonly sessions = new WeakMap<object, WebSocketAuthState>();
  private readonly activeStates = new Set<WebSocketAuthState>();

  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onConnect(context: unknown): Promise<boolean> {
    const envelope = readWebSocketEnvelope(context);
    if (!envelope || !this.hasAllowedOrigin(envelope.extra)) {
      return false;
    }

    try {
      const token = extractBearerTokenFromConnectionParams(
        envelope.connectionParams,
      );
      const session = await this.accessTokens.verifySession(token);
      this.setSession(envelope.extra, session);
      return true;
    } catch {
      return false;
    }
  }

  onSubscribe(context: unknown): void {
    const envelope = readWebSocketEnvelope(context);
    const state = envelope ? this.sessions.get(envelope.extra) : undefined;

    if (!state || isExpired(state.session)) {
      if (envelope) {
        closeSocket(envelope.extra, CloseCode.Forbidden, 'Forbidden');
      }
      return;
    }
  }

  onClose(context: unknown): void {
    const envelope = readWebSocketEnvelope(context);
    if (envelope) {
      this.clearSession(envelope.extra);
    }
  }

  create(context: unknown): GraphqlContext {
    if (isHttpContextInput(context)) {
      const result: HttpGraphqlContext = {
        transport: 'http',
        request: context.req,
        response: context.res,
      };
      return result;
    }

    const envelope = readWebSocketEnvelope(context);
    const state = envelope ? this.sessions.get(envelope.extra) : undefined;
    if (!state || isExpired(state.session)) {
      if (envelope) {
        closeSocket(envelope.extra, CloseCode.Forbidden, 'Forbidden');
      }
      throw new UnauthorizedException('Authentication is required.');
    }

    const result: WebSocketGraphqlContext = {
      transport: 'websocket',
      principal: state.session.principal,
      accessTokenExpiresAtEpochSeconds: state.session.expiresAtEpochSeconds,
    };
    return result;
  }

  onApplicationShutdown(): void {
    for (const state of this.activeStates) {
      clearTimeout(state.expiryTimer);
    }
    this.activeStates.clear();
  }

  private hasAllowedOrigin(extra: object): boolean {
    const origin = readOrigin(extra);
    return (
      origin !== null &&
      this.config.get('CORS_ORIGINS', { infer: true }).includes(origin)
    );
  }

  private setSession(extra: object, session: AuthenticatedSession): void {
    this.clearSession(extra);

    const delayMilliseconds = Math.max(
      0,
      session.expiresAtEpochSeconds * 1_000 - Date.now(),
    );
    const state: WebSocketAuthState = {
      extra,
      session,
      expiryTimer: setTimeout(() => {
        closeSocket(extra, CloseCode.Forbidden, ACCESS_TOKEN_EXPIRED_REASON);
        this.clearSession(extra);
      }, delayMilliseconds),
    };
    state.expiryTimer.unref();
    this.sessions.set(extra, state);
    this.activeStates.add(state);
  }

  private clearSession(extra: object): void {
    const existing = this.sessions.get(extra);
    if (!existing) {
      return;
    }
    clearTimeout(existing.expiryTimer);
    this.activeStates.delete(existing);
    this.sessions.delete(extra);
  }
}

interface HttpContextInput {
  req: Request;
  res: Response;
}

interface WebSocketEnvelope {
  connectionParams: unknown;
  extra: object;
}

function isHttpContextInput(value: unknown): value is HttpContextInput {
  return (
    isRecord(value) &&
    'req' in value &&
    isRecord(value.req) &&
    'res' in value &&
    isRecord(value.res)
  );
}

function readWebSocketEnvelope(value: unknown): WebSocketEnvelope | null {
  if (!isRecord(value) || !('extra' in value) || !isRecord(value.extra)) {
    return null;
  }
  return {
    connectionParams:
      'connectionParams' in value ? value.connectionParams : undefined,
    extra: value.extra,
  };
}

function readOrigin(extra: object): string | null {
  if (!('request' in extra) || !isRecord(extra.request)) {
    return null;
  }
  const request = extra.request;
  if (!('headers' in request) || !isRecord(request.headers)) {
    return null;
  }
  const origin = request.headers.origin;
  return typeof origin === 'string' ? origin : null;
}

function closeSocket(extra: object, code: number, reason: string): void {
  if ('socket' in extra && isClosableSocket(extra.socket)) {
    extra.socket.close(code, reason);
  }
}

function isClosableSocket(value: unknown): value is ClosableSocket {
  return (
    typeof value === 'object' &&
    value !== null &&
    'close' in value &&
    typeof value.close === 'function'
  );
}

function isExpired(session: AuthenticatedSession): boolean {
  return session.expiresAtEpochSeconds <= Math.floor(Date.now() / 1_000);
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}
