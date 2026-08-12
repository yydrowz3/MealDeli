import { Field, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dto/output.dto";
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

// @InputType()
// export class EditProfileInput extends PartialType(
//   PickType(User, ["email", "address", "image", "name"]),
// ) {
//   @Field(() => String)
//   password!: string;
// }

export class EditProfileInput {
  @Field(() => String, { nullable: true })
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @Field(() => String, { nullable: true })
  @IsUrl()
  image?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}

@ObjectType()
export class EditProfileOutput extends CoreOutput {}
