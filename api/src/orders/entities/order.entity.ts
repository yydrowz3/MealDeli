import { ObjectType, Field, Int } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { OrderStatus } from '../enums/status.enum';
import { OrderItem } from './order-item.entity';

@ObjectType()
export class Order extends CoreEntity {
  @Field(() => String)
  customerId!: string;

  @Field(() => String, { nullable: true })
  courierId!: string | null;

  @Field(() => String)
  restaurantId!: string;

  @Field(() => Restaurant)
  restaurant?: Restaurant;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => Int)
  totalMinor!: number;

  @Field(() => [OrderItem])
  items?: OrderItem[];
}
