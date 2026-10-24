import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreatePaymentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transactionId!: string;

  @Field(() => String)
  @IsUUID()
  restaurantId!: string;
}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {}
