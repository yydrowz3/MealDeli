import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_PASSWORD_LENGTH } from '@/auth/password-policy';
import { normalizeEmail } from '../normalize-email';

@InputType()
export class ChangeEmailInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  newEmail!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PASSWORD_LENGTH)
  currentPassword!: string;
}
