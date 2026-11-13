import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
// import { IsString, Length } from "class-validator";
import { Restaurant } from "../entities/restaurant.entity";
import { CoreOutput } from "src/common/dtos/output.dto";

// inputtype: one object, argsType: separate args

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
    "name",
    "coverImg",
    "address",
]) {
    @Field((type) => String)
    categoryName: string;
    // @Field((type) => String)
    // @IsString()
    // @Length(5, 10)
    // name: string;
    // @Field((type) => Boolean)
    // @IsString()
    // isVegan: boolean;
    // @Field((type) => String)
    // @IsString()
    // address: string;
    // @Field((type) => String)
    // @IsString()
    // ownerName: string;
    // @Field((type) => String)
    // categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
    @Field((type) => Int, { nullable: true })
    restaurantId?: number;
}
