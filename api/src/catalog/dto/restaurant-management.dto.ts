import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@InputType()
export class CreateRestaurantInput {
  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address!: string;

  @Field()
  @Transform(trimString)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  coverImageUrl!: string;

  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  categoryName!: string;
}

@InputType()
export class EditRestaurantInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;

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
  @MinLength(3)
  @MaxLength(255)
  address?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2_048)
  coverImageUrl?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  categoryName?: string | null;
}

@InputType()
export class DeleteRestaurantInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;
}

@ObjectType()
export class CreateRestaurantPayload extends OperationPayload {
  @Field(() => ID, { nullable: true })
  restaurantId?: string;
}

@ObjectType()
export class RestaurantOperationPayload extends OperationPayload {}
