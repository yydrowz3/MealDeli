import { PaymentProvider } from '../domain/payment-provider';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Payment')
export class PaymentModel {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentProvider)
  provider!: PaymentProvider;

  @Field(() => ID)
  restaurantId!: string;

  @Field(() => Int)
  amountMinor!: number;

  @Field()
  currency!: string;

  @Field(() => Date)
  promotionStartsAt!: Date;

  @Field(() => Date)
  promotionEndsAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
