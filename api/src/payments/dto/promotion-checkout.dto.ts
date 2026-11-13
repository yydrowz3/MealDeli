import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreatePromotionCheckoutInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;
}

@ObjectType()
export class CreatePromotionCheckoutPayload extends OperationPayload {
  @Field(() => String, { nullable: true })
  transactionId?: string;
}
