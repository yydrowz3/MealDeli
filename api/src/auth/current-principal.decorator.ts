import { createParamDecorator, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedPrincipal } from './auth-principal';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '@/auth/graphql-context';

// export const CurrentPrincipal = (...args: string[]) => SetMetadata('current-principal', args);
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, executionContext): AuthenticatedPrincipal => {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();
    if (!context.principal) {
      throw new UnauthorizedException('Authentication is required');
    }
    return context.principal;
  },
);
