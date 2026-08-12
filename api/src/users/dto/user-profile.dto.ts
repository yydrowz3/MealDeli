import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { User } from "../entities/user.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@ArgsType()
export class UserProfileInput {
  @Field(() => String)
  userId!: string;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user!: User | null;
}
