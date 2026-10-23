import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { PublicUser } from '../entities/public-user.entity';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsUUID } from 'class-validator';

@ArgsType()
export class UserProfileInput {
  @Field(() => String)
  @IsUUID()
  userId!: string;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(() => PublicUser, { nullable: true })
  user!: PublicUser | null;
}
