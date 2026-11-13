import { Field, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';
import { UserModel } from '../models/user.model';

@ObjectType()
export class UpdateUserPayload extends OperationPayload {
  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}
