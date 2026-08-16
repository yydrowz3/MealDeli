import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { DishOption } from './dish-option.entity';

@ObjectType()
export class Dish extends CoreEntity {
  @Field(() => String)
  name!: string;

  @Field(() => Int)
  priceMinor!: number;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => String)
  description!: string;

  @Field(() => [DishOption])
  options!: DishOption[];

  @Field(() => String)
  restaurantId!: string;
}
