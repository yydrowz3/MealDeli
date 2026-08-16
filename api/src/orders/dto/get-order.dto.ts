import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { Order } from '../entities/order.entity';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class GetOrderInput {
  @Field(() => String)
  @IsUUID()
  id!: string;
}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  order?: Order;
}
