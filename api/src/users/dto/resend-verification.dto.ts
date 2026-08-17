import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, MaxLength } from 'class-validator';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class ResendVerificationInput {
  @Field(() => String)
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

@ObjectType()
export class ResendVerificationOutput extends CoreOutput {}
