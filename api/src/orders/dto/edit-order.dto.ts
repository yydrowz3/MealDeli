import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../enums/status.enum';

@InputType()
export class EditOrderInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
