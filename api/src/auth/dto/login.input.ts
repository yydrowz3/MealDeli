import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { MAX_PASSWORD_LENGTH } from '@/auth/password-policy';
import { normalizeEmail } from '@/users/normalize-email';

@InputType()
export class LoginInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  email!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password!: string;
}
