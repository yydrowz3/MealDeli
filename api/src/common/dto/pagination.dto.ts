import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "./output.dto";

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page!: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  totalPages?: number;
}
