import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Category } from "./entities/category.entity";
import { RestaurantsService } from "./restaurants.service";
import { AllCategoriesOutput } from "./dto/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dto/category.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dto/restaurants.dto";
import { CreateCategoryInput, CreateCategoryOutput } from "./dto/create-category.dto";
import { UpdateCategoryInput, UpdateCategoryOutput } from "./dto/update-category.dto";
import { DeleteCategoryInput, DeleteCategoryOutput } from "./dto/delete-category.dto";

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantsService) {}

  @ResolveField(() => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category.id);
  }

  @Query(() => AllCategoriesOutput)
  allCategory(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }

  @Query(() => CategoryOutput)
  category(@Args("input") categoryInput: CategoryInput): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }

  @Query(() => RestaurantsOutput)
  restaurants(@Args("input") restaurantsInput: RestaurantsInput): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(restaurantsInput);
  }

  @Mutation(() => CreateCategoryOutput)
  createCategory(
    @Args("input") createCategoryInput: CreateCategoryInput,
  ): Promise<CreateCategoryOutput> {
    return this.restaurantService.createCategory(createCategoryInput);
  }

  @Mutation(() => UpdateCategoryOutput)
  updateCategory(
    @Args("input") updateCategoryInput: UpdateCategoryInput,
  ): Promise<UpdateCategoryOutput> {
    return this.restaurantService.updateCategory(updateCategoryInput);
  }

  @Mutation(() => DeleteCategoryOutput)
  deleteCategory(
    @Args("input") deleteCategoryInput: DeleteCategoryInput,
  ): Promise<DeleteCategoryOutput> {
    return this.restaurantService.deleteCategory(deleteCategoryInput);
  }
}
