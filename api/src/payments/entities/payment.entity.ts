import { ObjectType, Field } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';

@ObjectType()
export class Payment extends CoreEntity {
  @Field(() => String)
  transactionId!: string;

  @Field(() => String)
  ownerId!: string;

  @Field(() => String)
  restaurantId!: string;
}
