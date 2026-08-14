import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
export class Payment extends CoreEntity {
  @Field(() => String)
  transactionId!: string;

  @Field(() => String)
  ownerId!: string;

  @Field(() => User)
  owner?: User;

  @Field(() => String)
  restaurantId!: string;

  @Field(() => Restaurant)
  restaurant?: Restaurant;
}
