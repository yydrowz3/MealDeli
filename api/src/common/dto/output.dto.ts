import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CoreOutput {
  @Field(() => Boolean)
  ok!: boolean;

  @Field(() => String, { nullable: true })
  error?: string;
}
