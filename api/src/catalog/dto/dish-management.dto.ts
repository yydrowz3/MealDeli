import { MAX_MONEY_MINOR } from '../domain/money';
import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@InputType()
export class DishChoiceInput {
  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_MINOR)
  extraMinor!: number;
}

@InputType()
export class DishOptionInput {
  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_MINOR)
  extraMinor?: number | null;

  @Field(() => [DishChoiceInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DishChoiceInput)
  choices?: DishChoiceInput[] | null;
}

@InputType()
export class CreateDishInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;

  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description!: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_MINOR)
  priceMinor!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  photoUrl?: string | null;

  @Field(() => [DishOptionInput], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DishOptionInput)
  options: DishOptionInput[] = [];
}

@InputType()
export class EditDishInput {
  @Field(() => ID)
  @IsUUID('7')
  dishId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_MINOR)
  priceMinor?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  photoUrl?: string | null;

  @Field(() => [DishOptionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DishOptionInput)
  options?: DishOptionInput[] | null;
}

@InputType()
export class DeleteDishInput {
  @Field(() => ID)
  @IsUUID('7')
  dishId!: string;
}

@ObjectType()
export class CreateDishPayload extends OperationPayload {
  @Field(() => ID, { nullable: true })
  dishId?: string;
}

@ObjectType()
export class DishOperationPayload extends OperationPayload {}
