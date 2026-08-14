import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { Dish } from '../../restaurants/entities/dish.entity';
import { Order } from './order.entity';
import { IsInt } from 'class-validator';

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

  @Field(() => Order)
  order?: Order;

  @Field(() => String)
  dishId!: string;

  @Field(() => Dish)
  dish?: Dish;

  @Field(() => Int)
  basePriceMinor!: number;

  @Field(() => [OrderItemOption])
  selectedOptions!: OrderItemOption[];

  @Field(() => Int)
  optionsExtraMinor!: number;

  @Field(() => Int)
  @IsInt()
  quantity!: number;

  @Field(() => Int)
  lineTotalMinor!: number;
}
