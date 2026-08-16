import { ObjectType, Field, HideField } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { UserRole } from '../enums/role.enum';

@ObjectType()
export class User extends CoreEntity {
  @Field(() => String)
  email!: string;

  @HideField()
  passwordHash!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  address!: string | null;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => Date, { nullable: true })
  verifiedAt!: Date | null;
}
