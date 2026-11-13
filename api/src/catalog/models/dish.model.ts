import { DishOptionModel } from './dish-option.model';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Dish')
export class DishModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => Int)
  priceMinor!: number;

  @Field(() => String, { nullable: true })
  photoUrl!: string | null;

  @Field(() => [DishOptionModel])
  options!: DishOptionModel[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
