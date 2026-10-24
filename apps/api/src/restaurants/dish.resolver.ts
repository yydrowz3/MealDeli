import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Dish } from './entities/dish.entity';
import { RestaurantsService } from './restaurants.service';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { User } from '../users/entities/user.entity';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantsService) {}

  @Mutation(() => CreateDishOutput)
  @Roles(UserRole.OWNER)
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, createDishInput);
  }

  @Mutation(() => EditDishOutput)
  @Roles(UserRole.OWNER)
  editDish(
    @AuthUser() owner: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantService.editDish(owner, editDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Roles(UserRole.OWNER)
  deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantService.deleteDish(owner, deleteDishInput);
  }
}
