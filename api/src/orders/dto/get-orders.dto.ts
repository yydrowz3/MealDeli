import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { OrderStatus } from "../enums/status.enum";
import { CoreOutput } from "../../common/dto/output.dto";
import { Order } from "../entities/order.entity";

@InputType()
export class GetOrdersInput {
  @Field(() => OrderStatus, { nullable: true })
  status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}
