import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class OrderUpdatesInput {
  @Field(() => ID)
  @IsUUID('7')
  orderId!: string;
}
