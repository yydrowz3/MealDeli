import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteRestaurantInput {
  @Field(() => String)
  @IsUUID()
  restaurantId!: string;
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}
