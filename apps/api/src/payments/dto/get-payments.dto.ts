import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { Payment } from '../entities/payment.entity';

@ObjectType()
export class GetPaymentsOutput extends CoreOutput {
  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];
}
