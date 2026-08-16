import { Field, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { UserRole } from '../enums/role.enum';

@ObjectType()
export class PublicUser extends CoreEntity {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field(() => UserRole)
  role!: UserRole;
}
