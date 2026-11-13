import { OperationPayload } from '@/common/dto/operation.payload';
import { PageInput } from '@/common/pagination/page.input';
import { PaymentModel } from '../models/payment.model';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class MyPaymentsInput extends PageInput {}

@ObjectType()
export class MyPaymentsPayload extends OperationPayload {
  @Field(() => [PaymentModel])
  payments: PaymentModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}
