import { OrderStatus } from '../domain/order-status';
import { OrderRestaurantModel } from './order.model';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CookedOrderOffer')
export class CookedOrderOfferModel {
  @Field(() => ID)
  id!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => Int)
  version!: number;

  @Field(() => OrderRestaurantModel)
  restaurant!: OrderRestaurantModel;

  @Field(() => Date)
  createdAt!: Date;
}
