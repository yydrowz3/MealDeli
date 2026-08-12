import { ObjectType, Field, InputType, HideField } from "@nestjs/graphql";
import { CoreEntity } from "../../common/entities/core.entity";
import { IsDate, IsEnum, IsString } from "class-validator";
import { UserRole } from "../enums/role.enum";

@InputType("UserInputType", { isAbstract: true })
@ObjectType()
export class User extends CoreEntity {
  @Field(() => String)
  @IsString()
  email!: string;

  @HideField()
  passwordHash!: string;

  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  address!: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  image!: string | null;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role!: UserRole;

  @Field(() => Date, { nullable: true })
  @IsDate()
  verifiedAt!: Date | null;
}
