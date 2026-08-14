import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { IsDate, IsString } from 'class-validator';

@InputType({ isAbstract: true })
@ObjectType()
export class Verification extends CoreEntity {
  @Field(() => String)
  @IsString()
  userId!: string;

  @Field(() => String)
  @IsString()
  tokenHash!: string;

  @Field(() => Date)
  @IsDate()
  expiresAt!: Date;
}
