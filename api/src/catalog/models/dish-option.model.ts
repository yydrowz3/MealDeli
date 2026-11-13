import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('DishChoice')
export class DishChoiceModel {
  @Field()
  name!: string;

  @Field(() => Int)
  extraMinor!: number;
}

@ObjectType('DishOption')
export class DishOptionModel {
  @Field()
  name!: string;

  @Field(() => Int, { nullable: true })
  extraMinor!: number | null;

  @Field(() => [DishChoiceModel], { nullable: true })
  choices!: DishChoiceModel[] | null;
}
