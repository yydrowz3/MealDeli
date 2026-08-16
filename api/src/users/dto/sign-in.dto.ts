import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignInInput {
  @Field(() => String)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

@ObjectType()
export class SignInOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  accessToken!: string | null;

  // This value is only used internally by the resolver to set the HttpOnly cookie.
  // Do not expose it in the GraphQL schema.
  refreshToken?: string | null;
}
