import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

@ObjectType()
export class DishChoice {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Int)
  extraMinor!: number;
}

@ObjectType()
export class DishOption {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Int)
  minSelections!: number;

  @Field(() => Int)
  maxSelections!: number;

  @Field(() => [DishChoice])
  choices!: DishChoice[];
}

@InputType()
export class CreateDishChoiceInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  extraMinor!: number;
}

@InputType()
export class CreateDishOptionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  minSelections!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  maxSelections!: number;

  @Field(() => [CreateDishChoiceInput])
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateDishChoiceInput)
  @ValidateNested({ each: true })
  choices!: CreateDishChoiceInput[];
}

@InputType()
export class EditDishChoiceInput extends CreateDishChoiceInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id?: string;
}

@InputType()
export class EditDishOptionInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  minSelections!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  maxSelections!: number;

  @Field(() => [EditDishChoiceInput])
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => EditDishChoiceInput)
  @ValidateNested({ each: true })
  choices!: EditDishChoiceInput[];
}
