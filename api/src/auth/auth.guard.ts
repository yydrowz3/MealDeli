import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AllowedRole, ROLES_KEY } from "./decorator/roles.decorator";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "../jwt/jwt.service";
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
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === "object" && decoded.hasOwnProperty("id")) {
        const { user } = await this.usersService.findById(decoded["id"]);
        if (!user) {
          return false;
        }
        gqlContext["User"] = user;
        if (roles.includes("Any")) {
          return true;
        }
        return roles.includes(user.role);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
