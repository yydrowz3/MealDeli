import { UserRole } from '@/users/user-role.enum';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field()
  emailVerified!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
