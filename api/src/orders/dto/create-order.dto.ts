import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { OrderItemOption } from '../entities/order-item.entity';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
class CreateOrderItemInput {
  @Field(() => String)
  dishId!: string;

  @Field(() => [OrderItemOption])
  options!: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field(() => String)
  restaurantId!: string;

  @Field(() => [CreateOrderItemInput])
  items!: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  orderId?: string;
}
