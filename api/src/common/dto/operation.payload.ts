import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class OperationPayload {
  @Field()
  ok!: boolean;

  @Field(() => String, { nullable: true })
  error?: string;
}
