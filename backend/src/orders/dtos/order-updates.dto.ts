import { InputType, PickType } from "@nestjs/graphql";
import { Order } from "../entities/order.entity.js";

@InputType()
export class OrderUpdatesInput extends PickType(Order, ["id"]) {}
