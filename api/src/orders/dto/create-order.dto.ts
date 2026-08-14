import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
class CreateOrderItemOptionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  optionId!: string;

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  choiceIds!: string[];
}

@InputType()
class CreateOrderItemInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  dishId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Field(() => [CreateOrderItemOptionInput])
  @IsArray()
  @ArrayUnique((option: CreateOrderItemOptionInput) => option.optionId)
  @Type(() => CreateOrderItemOptionInput)
  @ValidateNested({ each: true })
  options!: CreateOrderItemOptionInput[];
}

@InputType()
export class CreateOrderInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @Field(() => [CreateOrderItemInput])
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateOrderItemInput)
  @ValidateNested({ each: true })
  items!: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  orderId?: string;
}
