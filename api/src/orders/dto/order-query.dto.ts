import { OrderStatus } from '../domain/order-status';
import { OrderModel } from '../models/order.model';
import { OperationPayload } from '@/common/dto/operation.payload';
import { PageInput } from '@/common/pagination/page.input';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class GetOrderInput {
  @Field(() => ID)
  @IsUUID('7')
  orderId!: string;
}

@InputType()
export class GetOrdersInput extends PageInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus | null;
}

@ObjectType()
export class GetOrderPayload extends OperationPayload {
  @Field(() => OrderModel, { nullable: true })
  order?: OrderModel;
}

@ObjectType()
export class GetOrdersPayload extends OperationPayload {
  @Field(() => [OrderModel])
  orders: OrderModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}
