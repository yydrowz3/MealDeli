import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { AuthenticatedHttpRequest } from '@/auth/http-authenticated-request';
import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentHttpPrincipal = createParamDecorator(
  (
    _data: unknown,
    executionContext: ExecutionContext,
  ): AuthenticatedPrincipal => {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>();

    if (!request.principal) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return request.principal;
  },
);
