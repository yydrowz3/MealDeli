import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export const AuthSessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const gqlContext = GqlExecutionContext.create(ctx).getContext();
    return gqlContext["sessionId"];
  },
);
