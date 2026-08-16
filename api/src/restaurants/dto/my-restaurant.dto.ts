import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class MyRestaurantInput {
  @Field(() => String)
  @IsUUID()
  id!: string;
}

@ObjectType()
export class MyRestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  restaurant!: Restaurant | null;
}
