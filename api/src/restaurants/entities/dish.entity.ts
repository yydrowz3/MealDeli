import { Field, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "../../common/entities/core.entity";
import { IsInt } from "class-validator";
import { Restaurant } from "./restaurant.entity";
import { DishOption } from "./dish-option.entity";

@ObjectType()
export class Dish extends CoreEntity {
  @Field(() => String)
  name!: string;

  @Field(() => Number)
  @IsInt()
  priceMinor!: number;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => String)
  description!: string;

  @Field(() => [DishOption])
  options!: DishOption[];

  @Field(() => Restaurant)
  restaurant!: Restaurant;

  @Field(() => String)
  restaurantId!: string;
}
