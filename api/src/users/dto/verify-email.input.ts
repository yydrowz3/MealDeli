import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;
}
