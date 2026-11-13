import { Field, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';

@ObjectType()
export class VerifyEmailPayload extends OperationPayload {
  @Field()
  verified!: boolean;
}
