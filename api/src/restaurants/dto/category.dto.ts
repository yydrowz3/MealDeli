import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PaginationInput, PaginationOutput } from "../../common/dto/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";
import { Category } from "../entities/category.entity";

@InputType()
export class CategoryInput extends PaginationInput {
  @Field(() => String)
  slug!: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants!: Restaurant[] | null;

  @Field(() => Category, { nullable: true })
  category!: Category | null;
}
