import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import {
    PaginationInput,
    PaginationOutput,
} from "src/common/dtos/pagination.dto";

@InputType()
export class SearchRestaurantInput extends PaginationInput {
    @Field((type) => String)
    query: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
    @Field((type) => [Restaurant], { nullable: true })
    restaurants?: Restaurant[];
}
