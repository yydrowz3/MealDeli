import { OperationPayload } from '@/common/dto/operation.payload';
import { UserModel } from '@/users/models/user.model';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload extends OperationPayload {
  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => Int, { nullable: true })
  expiresIn?: number;

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}
