import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @Field(() => String)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

@ObjectType()
export class SignUpOutput extends CoreOutput {}
