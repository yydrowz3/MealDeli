import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dto/output.dto";
import { IsString } from "class-validator";

// @InputType()
// export class VerifyEmailInput extends PickType(Verification, ["tokenHash"]) {}

@InputType()
export class VerifyEmailInput {
  @Field(() => String)
  @IsString()
  token!: string;
}

@ObjectType()
export class VerifyEmailOutput extends CoreOutput {}
