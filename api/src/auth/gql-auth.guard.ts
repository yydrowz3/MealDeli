import { AccessTokenService } from '@/auth/access-token.service';
import { extractBearerToken } from '@/auth/bearer-token';
import {
  type GraphqlContext,
  isGraphqlSessionExpired,
} from '@/auth/graphql-context';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();

    if (context.transport === 'websocket') {
      if (!context.principal || isGraphqlSessionExpired(context)) {
        throw new UnauthorizedException('Authentication is required.');
      }
      return true;
    }

    const accessToken = extractBearerToken(context.request);
    const session = await this.accessTokens.verifySession(accessToken);
    context.principal = session.principal;
    context.accessTokenExpiresAtEpochSeconds = session.expiresAtEpochSeconds;
    return true;
  }
}
