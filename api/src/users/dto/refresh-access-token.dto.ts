import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class RefreshAccessTokenInput {
  @Field(() => String)
  refreshToken!: string;
}

@ObjectType()
export class RefreshAccessTokenOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  accessToken!: string | null;

  @Field(() => String, { nullable: true })
  refreshToken!: string | null;
}
