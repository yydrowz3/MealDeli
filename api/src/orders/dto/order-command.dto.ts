import {
  MAX_ORDER_ITEMS,
  MAX_SELECTED_OPTIONS,
} from '../domain/order-selection';
import { OrderStatus } from '../domain/order-status';
import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@InputType()
export class OrderOptionSelectionInput {
  @Field()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  choice?: string | null;
}

@InputType()
export class CreateOrderItemInput {
  @Field(() => ID)
  @IsUUID('7')
  dishId!: string;

  @Field(() => [OrderOptionSelectionInput], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(MAX_SELECTED_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => OrderOptionSelectionInput)
  options: OrderOptionSelectionInput[] = [];
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;

  @Field(() => ID, {
    description:
      'A client-generated UUID v4 scoped to the authenticated customer',
  })
  @IsUUID('4')
  idempotencyKey!: string;

  @Field(() => [CreateOrderItemInput])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ORDER_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items!: CreateOrderItemInput[];
}

@InputType()
export class EditOrderInput {
  @Field(() => ID)
  @IsUUID('7')
  orderId!: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@InputType()
export class TakeOrderInput {
  @Field(() => ID)
  @IsUUID('7')
  orderId!: string;
}

@ObjectType()
export class CreateOrderPayload extends OperationPayload {
  @Field(() => ID, { nullable: true })
  orderId?: string;

  @Field(() => Boolean)
  replayed: boolean = false;
}

@ObjectType()
export class OrderOperationPayload extends OperationPayload {
  @Field(() => Boolean)
  replayed: boolean = false;
}
