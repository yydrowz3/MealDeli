import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AllowedRole, ROLES_KEY } from "./decorator/roles.decorator";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRole>(ROLES_KEY, context.getHandler());
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    if (!token) {
      throw new UnauthorizedException("Authentication Required");
    }

    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token.toString());
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (typeof payload.sub !== "string" || !payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const { user } = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    gqlContext.user = user;

    if (roles.includes("Any")) {
      return true;
    }
    return roles.includes(user.role);
  }
}
