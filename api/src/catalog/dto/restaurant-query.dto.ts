import { RestaurantModel } from '../models/restaurant.model';
import { PageInput } from '@/common/pagination/page.input';
import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class RestaurantsInput extends PageInput {}

@InputType()
export class RestaurantInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;
}

@ObjectType()
export class RestaurantsPayload extends OperationPayload {
  @Field(() => [RestaurantModel])
  results: RestaurantModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}

@ObjectType()
export class RestaurantPayload extends OperationPayload {
  @Field(() => RestaurantModel, { nullable: true })
  restaurant?: RestaurantModel;
}
