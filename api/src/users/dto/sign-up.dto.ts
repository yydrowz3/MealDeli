import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { User } from "../entities/user.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class SignUpInput extends PickType(User, ["email", "name"]) {
  @Field(() => String)
  password!: string;
}

@ObjectType()
export class SignUpOutput extends CoreOutput {}
