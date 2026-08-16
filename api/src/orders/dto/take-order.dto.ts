import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsUUID } from 'class-validator';

@InputType()
export class TakeOrderInput {
  @Field(() => String)
  @IsUUID()
  id!: string;
}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
