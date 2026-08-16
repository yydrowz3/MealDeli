import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { EditDishOptionInput } from '../entities/dish-option.entity';
import {
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
export class EditDishInput {
  @Field(() => String)
  @IsUUID()
  dishId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMinor?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string | null;

  @Field(() => [EditDishOptionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @Type(() => EditDishOptionInput)
  @ValidateNested({ each: true })
  options?: EditDishOptionInput[];
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
