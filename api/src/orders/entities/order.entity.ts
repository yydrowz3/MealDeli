import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../users/entities/user.entity';
import { IsEnum } from 'class-validator';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { OrderStatus } from '../enums/status.enum';
import { OrderItem } from './order-item.entity';

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
export class Order extends CoreEntity {
  @Field(() => String)
  customerId!: string;

  @Field(() => User)
  customer?: User;

  @Field(() => String, { nullable: true })
  courierId!: string | null;

  @Field(() => User, { nullable: true })
  courier?: User;

  @Field(() => String)
  restaurantId!: string;

  @Field(() => Restaurant)
  restaurant?: Restaurant;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @Field(() => Int)
  totalMinor!: number;

  @Field(() => [OrderItem])
  items?: OrderItem[];
}
