import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, ["name", "image", "address"]) {
  @Field(() => String)
  categoryName!: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  restaurantId!: string | null;
}
