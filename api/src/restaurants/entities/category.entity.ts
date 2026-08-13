import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "../../common/entities/core.entity";
import { IsOptional, IsString } from "class-validator";
import { Restaurant } from "./restaurant.entity";

@InputType("CategoryInputType", { isAbstract: true })
@ObjectType()
export class Category extends CoreEntity {
  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  image!: string | null;

  @Field(() => String)
  @IsString()
  slug!: string;

  @Field(() => [Restaurant])
  restaurants!: Restaurant[];
}
