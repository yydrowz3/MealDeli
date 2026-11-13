import type { GraphqlContext } from '@/auth/graphql-context';
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(executionContext: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();
    if (context.transport !== 'http') {
      throw new Error('HTTP throttling cannot run on a WebSocket operation.');
    }
    return {
      req: context.request,
      res: context.response,
    };
  }
}
