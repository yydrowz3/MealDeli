import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';

@ObjectType()
export class OrderItemOptionChoice {
  @Field(() => String)
  choiceId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Int)
  extraMinor!: number;
}

@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  optionId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => [OrderItemOptionChoice])
  choices!: OrderItemOptionChoice[];
}

@ObjectType()
export class OrderItem extends CoreEntity {
  @Field(() => String)
  orderId!: string;

  @Field(() => String)
  dishId!: string;

  @Field(() => String)
  dishName!: string;

  @Field(() => Int)
  position!: number;

  @Field(() => Int)
  basePriceMinor!: number;

  @Field(() => [OrderItemOption])
  selectedOptions!: OrderItemOption[];

  @Field(() => Int)
  optionsExtraMinor!: number;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  lineTotalMinor!: number;
}
