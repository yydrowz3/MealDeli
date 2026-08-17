import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AllowedRole, ROLES_KEY } from './decorator/roles.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AccessTokenVerifier } from './access-token-verifier';
import type { User } from '../users/entities/user.entity';

type GraphqlAuthContext = {
  token?: unknown;
  user?: User;
  sessionId?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenVerifier: AccessTokenVerifier,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRole>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    const gqlContext =
      GqlExecutionContext.create(context).getContext<GraphqlAuthContext>();
    const token =
      typeof gqlContext.token === 'string' ? gqlContext.token : undefined;
    const { user, sessionId } = await this.accessTokenVerifier.verify(token);
    gqlContext.user = user;
    gqlContext.sessionId = sessionId;

    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role);
  }
}
