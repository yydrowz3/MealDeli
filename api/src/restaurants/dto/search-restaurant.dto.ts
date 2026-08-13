import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PaginationInput, PaginationOutput } from "../../common/dto/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class SearchRestaurantInput extends PaginationInput {
  @Field(() => String)
  query!: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants!: Restaurant[] | null;
}
