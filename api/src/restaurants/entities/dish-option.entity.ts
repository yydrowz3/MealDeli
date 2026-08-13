import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

@ObjectType()
@InputType("DishChoiceInput", { isAbstract: true })
export class DishChoice {
  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  extraMinor?: number;
}

@ObjectType()
@InputType("DishOptionInput", { isAbstract: true })
export class DishOption {
  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => [DishChoice], { nullable: true })
  @IsOptional()
  @Type(() => DishChoice)
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  extraMinor?: number;
}
