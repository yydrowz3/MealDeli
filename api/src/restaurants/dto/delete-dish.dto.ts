import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteDishInput {
  @Field(() => String)
  @IsUUID()
  dishId!: string;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
