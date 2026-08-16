import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateRestaurantInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string | null;

  @Field(() => String)
  @IsUUID()
  categoryId!: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  restaurantId!: string | null;
}
