import { CategoryModel } from './category.model';
import { DishModel } from './dish.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Restaurant')
export class RestaurantModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;

  @Field()
  coverImageUrl!: string;

  @Field(() => CategoryModel)
  category!: CategoryModel;

  @Field(() => [DishModel])
  menu!: DishModel[];

  @Field()
  isPromoted!: boolean;

  @Field(() => Date, { nullable: true })
  promotedUntil?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
