import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AllowedRole, ROLES_KEY } from './decorator/roles.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenPayload } from './types/token-payload.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRole>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    if (!token) {
      throw new UnauthorizedException('Authentication Required');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(
        token.toString(),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (
      payload.tokenType !== 'access' ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.sid !== 'string' ||
      !payload.sid
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findUserByActiveSession(payload.sid);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Session has expired or was signed out');
    }
    gqlContext.user = user;
    gqlContext.sessionId = payload.sid;

    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role);
  }
}
