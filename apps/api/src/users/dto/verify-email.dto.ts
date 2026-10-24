import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsNotEmpty, IsString, Length } from 'class-validator';

// @InputType()
// export class VerifyEmailInput extends PickType(Verification, ["tokenHash"]) {}

@InputType()
export class VerifyEmailInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  token!: string;
}

@ObjectType()
export class VerifyEmailOutput extends CoreOutput {}
