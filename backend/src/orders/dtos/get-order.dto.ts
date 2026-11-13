import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Order } from "../entities/order.entity";
import { CoreOutput } from "src/common/dtos/output.dto";

@InputType()
export class GetOrderInput extends PickType(Order, ["id"]) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
    @Field((type) => Order, { nullable: true })
    order?: Order;
}
