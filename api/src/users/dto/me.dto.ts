import { Field, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dto/output.dto";
import { UserRole } from "../enums/role.enum";

@ObjectType()
export class MeOutput extends CoreOutput {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String)
  name!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => Date, { nullable: true })
  verifiedAt?: Date;
}
