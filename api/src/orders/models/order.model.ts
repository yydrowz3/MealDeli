import { OrderStatus } from '../domain/order-status';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('OrderParty')
export class OrderPartyModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;
}

@ObjectType('OrderRestaurant')
export class OrderRestaurantModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;
}

@ObjectType('SelectedOrderOption')
export class SelectedOrderOptionModel {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  choice!: string | null;

  @Field(() => Int)
  extraMinor!: number;
}

@ObjectType('OrderItem')
export class OrderItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  dishId!: string;

  @Field()
  dishName!: string;

  @Field(() => Int)
  basePriceMinor!: number;

  @Field(() => [SelectedOrderOptionModel])
  selectedOptions!: SelectedOrderOptionModel[];

  @Field(() => Int)
  optionsExtraMinor!: number;

  @Field(() => Int)
  lineTotalMinor!: number;
}

@ObjectType('Order')
export class OrderModel {
  @Field(() => ID)
  id!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => Int)
  totalMinor!: number;

  @Field(() => Int)
  version!: number;

  @Field(() => OrderPartyModel)
  customer!: OrderPartyModel;

  @Field(() => OrderPartyModel, { nullable: true })
  courier!: OrderPartyModel | null;

  @Field(() => OrderRestaurantModel)
  restaurant!: OrderRestaurantModel;

  @Field(() => [OrderItemModel])
  items!: OrderItemModel[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
