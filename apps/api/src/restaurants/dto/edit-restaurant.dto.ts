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
export class EditRestaurantInput {
  @Field(() => String)
  @IsUUID()
  restaurantId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string | null;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
