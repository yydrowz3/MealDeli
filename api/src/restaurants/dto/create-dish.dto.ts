import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { CreateDishOptionInput } from '../entities/dish-option.entity';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDishInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string | null;

  @Field(() => String)
  @IsUUID()
  restaurantId!: string;

  @Field(() => [CreateDishOptionInput])
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => CreateDishOptionInput)
  @ValidateNested({ each: true })
  options!: CreateDishOptionInput[];
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
