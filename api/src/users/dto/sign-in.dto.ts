import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { User } from "../entities/user.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class SignInInput extends PickType(User, ["email"]) {
  @Field(() => String)
  password!: string;
}

@ObjectType()
export class SignInOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  token?: string;
}
