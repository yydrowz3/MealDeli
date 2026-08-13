import { Field, InputType, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class EditRestaurantInput extends PartialType(
  PickType(Restaurant, ["name", "image", "address"]),
) {
  @Field(() => String)
  restaurantId!: string;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
