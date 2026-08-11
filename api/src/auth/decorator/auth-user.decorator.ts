import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export const AuthUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const gqlContext = GqlExecutionContext.create(ctx).getContext();
  const user = gqlContext["user"];
  return user;
});
