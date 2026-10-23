import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { TokenPayload } from './types/token-payload.type';

export type VerifiedAccessToken = {
  user: User;
  sessionId: string;
};

@Injectable()
export class AccessTokenVerifier {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async verify(token: string | undefined): Promise<VerifiedAccessToken> {
    if (!token) throw new UnauthorizedException('Authentication Required');

    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(token);
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
    return { user, sessionId: payload.sid };
  }
}
