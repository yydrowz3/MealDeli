import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Category } from "../entities/category.entity";
import { CoreOutput } from "../../common/dto/output.dto";
import { IsOptional, IsString } from "class-validator";

@InputType()
export class CreateCategoryInput extends PickType(Category, ["name"]) {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  image?: string | null;
}

@ObjectType()
export class CreateCategoryOutput extends CoreOutput {}
