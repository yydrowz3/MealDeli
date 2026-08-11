import { InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Verification } from "../entities/verification.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class VerifyEmailInput extends PickType(Verification, ["tokenHash"]) {}

@ObjectType()
export class VerifyEmailOutput extends CoreOutput {}
