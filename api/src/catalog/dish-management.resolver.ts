import { DishManagementService } from './application/dish-management.service';
import { catalogErrorMessage } from './domain/catalog-result';
import {
  CreateDishInput,
  CreateDishPayload,
  DeleteDishInput,
  DishOperationPayload,
  EditDishInput,
} from './dto/dish-management.dto';
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
export class DishManagementResolver {
  constructor(private readonly dishes: DishManagementService) {}

  @Mutation(() => CreateDishPayload)
  async createDish(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: CreateDishInput,
  ): Promise<CreateDishPayload> {
    const result = await this.dishes.create(principal, input);
    return result.ok
      ? {
          ok: true,
          dishId: result.value.id,
        }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }

  @Mutation(() => DishOperationPayload)
  async editDish(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: EditDishInput,
  ): Promise<DishOperationPayload> {
    const result = await this.dishes.edit(principal, input);
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }

  @Mutation(() => DishOperationPayload)
  async deleteDish(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: DeleteDishInput,
  ): Promise<DishOperationPayload> {
    const result = await this.dishes.delete(principal, input.dishId);
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          error: catalogErrorMessage(result.error),
        };
  }
}
