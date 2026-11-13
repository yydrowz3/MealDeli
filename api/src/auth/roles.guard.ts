import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { GraphqlContext } from '@/auth/graphql-context';
import type { AuthenticatedHttpRequest } from '@/auth/http-authenticated-request';
import { ROLES_METADATA_KEY } from '@/auth/roles.decorator';
import type { UserRole } from '@/users/user-role.enum';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<readonly UserRole[]>(
      ROLES_METADATA_KEY,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const principal = getPrincipal(executionContext);
    if (!principal) {
      throw new UnauthorizedException('Authentication is required.');
    }

    if (!requiredRoles.includes(principal.role)) {
      throw new ForbiddenException('Insufficient role.');
    }

    return true;
  }
}

function getPrincipal(
  executionContext: ExecutionContext,
): AuthenticatedPrincipal | undefined {
  const contextType = executionContext.getType<string>();

  if (contextType === 'http') {
    return executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>().principal;
  }

  if (contextType === 'graphql') {
    return GqlExecutionContext.create(
      executionContext,
    ).getContext<GraphqlContext>().principal;
  }

  return undefined;
}
