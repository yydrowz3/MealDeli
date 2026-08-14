import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "../../common/entities/core.entity";
import { Dish } from "../../restaurants/entities/dish.entity";
import { Order } from "./order.entity";
import { IsInt } from "class-validator";

@InputType("OrderItemOptionChoiceInputType", { isAbstract: true })
@ObjectType()
export class OrderItemOptionChoice {
  @Field(() => String)
  name!: string;

  @Field(() => Int, { nullable: true })
  extraMinor?: number;
}

@InputType("OrderItemOptionInputType", { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  name!: string;

  @Field(() => [OrderItemOptionChoice])
  choices?: OrderItemOptionChoice[];

  @Field(() => Int, { nullable: true })
  extraMinor?: number;
}

@InputType("OrderItemInputType", { isAbstract: true })
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
  selectedOptions!: [OrderItemOption];

  @Field(() => Int)
  optionsExtraMinor!: number;

  @Field(() => Int)
  @IsInt()
  quantity!: number;

  @Field(() => Int)
  lineTotalMinor!: number;
}
