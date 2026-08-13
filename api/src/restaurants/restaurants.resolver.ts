import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { RestaurantsService } from "./restaurants.service";
import { Restaurant } from "./entities/restaurant.entity";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dto/create-restaurant.dto";
import { AuthUser } from "../auth/decorator/auth-user.decorator";
import { User } from "../users/entities/user.entity";
import { Roles } from "../auth/decorator/roles.decorator";
import { UserRole } from "../generated/prisma/enums";
import { MyRestaurantsOutput } from "./dto/my-restaurants.dto";
import { MyRestaurantInput, MyRestaurantOutput } from "./dto/my-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dto/edit-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dto/delete-restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dto/restaurants.dto";
import { RestaurantInput, RestaurantOutput } from "./dto/restaurant.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dto/search-restaurant.dto";

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Roles(UserRole.OWNER)
  createRestaurant(
    @AuthUser() authUser: User,
    @Args("input") createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantsService.createRestaurant(authUser, createRestaurantInput);
  }

  @Query(() => MyRestaurantsOutput)
  @Roles(UserRole.OWNER)
  myRestaurants(@AuthUser() owner: User): Promise<MyRestaurantsOutput> {
    return this.restaurantsService.myRestaurants(owner);
  }

  @Query(() => MyRestaurantOutput)
  @Roles(UserRole.OWNER)
  myRestaurant(
    @AuthUser() owner: User,
    @Args("input") myRestaurantInput: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    return this.restaurantsService.myRestaurant(owner, myRestaurantInput);
  }

  @Mutation(() => EditRestaurantOutput)
  @Roles(UserRole.OWNER)
  editRestaurant(
    @AuthUser() owner: User,
    @Args("input") editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantsService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Roles(UserRole.OWNER)
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args("input") deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(owner, deleteRestaurantInput);
  }

  @Query(() => RestaurantsOutput)
  restaurants(@Args("input") restaurantsInput: RestaurantsInput): Promise<RestaurantsOutput> {
    return this.restaurantsService.allRestaurants(restaurantsInput);
  }

  @Query(() => RestaurantOutput)
  restaurant(@Args("input") restaurantInput: RestaurantInput): Promise<RestaurantOutput> {
    return this.restaurantsService.findRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantOutput)
  searchRestaurant(
    @Args("input") searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantsService.searchRestaurantByName(searchRestaurantInput);
  }
}
