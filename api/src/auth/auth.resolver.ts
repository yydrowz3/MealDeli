import { AuthService } from '@/auth/auth.service';
import { AuthPayload } from '@/auth/dto/auth.payload';
import { LoginInput } from '@/auth/dto/login.input';
import { GqlThrottlerGuard } from '@/auth/gql-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const result = await this.authService.login({
      email: input.email,
      password: input.password,
    });
    if (!result.ok) {
      return {
        ok: false,
        error: 'Invalid email or password',
      };
    }
    return {
      ok: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }
}
