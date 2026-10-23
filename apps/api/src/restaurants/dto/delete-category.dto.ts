import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteCategoryInput {
  @Field(() => String)
  @IsUUID()
  id!: string;
}

@ObjectType()
export class DeleteCategoryOutput extends CoreOutput {}
