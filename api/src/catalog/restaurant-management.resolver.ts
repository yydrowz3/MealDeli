import { RestaurantManagementService } from './application/restaurant-management.service';
import { catalogErrorMessage } from './domain/catalog-result';
import {
  CreateRestaurantInput,
  CreateRestaurantPayload,
  DeleteRestaurantInput,
  EditRestaurantInput,
  RestaurantOperationPayload,
} from './dto/restaurant-management.dto';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Resolver()
export class RestaurantManagementResolver {
  constructor(private readonly restaurants: RestaurantManagementService) {}

  @Mutation(() => CreateRestaurantPayload)
  async createRestaurant(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: CreateRestaurantInput,
  ): Promise<CreateRestaurantPayload> {
    const result = await this.restaurants.create(principal, input);
    return result.ok
      ? {
          ok: true,
          restaurantId: result.value.id,
        }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }

  @Mutation(() => RestaurantOperationPayload)
  async editRestaurant(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: EditRestaurantInput,
  ): Promise<RestaurantOperationPayload> {
    const result = await this.restaurants.edit(principal, input);
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }

  @Mutation(() => RestaurantOperationPayload)
  async deleteRestaurant(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: DeleteRestaurantInput,
  ): Promise<RestaurantOperationPayload> {
    const result = await this.restaurants.delete(principal, input.restaurantId);
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }
}
