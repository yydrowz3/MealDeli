import { InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Category } from "../entities/category.entity";
import { CoreOutput } from "../../common/dto/output.dto";

@InputType()
export class DeleteCategoryInput extends PickType(Category, ["id"]) {}

@ObjectType()
export class DeleteCategoryOutput extends CoreOutput {}
