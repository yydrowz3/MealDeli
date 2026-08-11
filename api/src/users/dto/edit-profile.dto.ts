import { Field, InputType, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { User } from "../entities/user.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ["email", "address", "image", "name"]),
) {
  @Field(() => String)
  password!: string;
}

@ObjectType()
export class EditProfileOutput extends CoreOutput {}
