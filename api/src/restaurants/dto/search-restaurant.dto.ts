import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PaginationInput, PaginationOutput } from "../../common/dto/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";
import { IsString, MinLength } from "class-validator";

@InputType()
export class SearchRestaurantInput extends PaginationInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  query!: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants!: Restaurant[] | null;
}
