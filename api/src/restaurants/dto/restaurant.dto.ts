import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import { Restaurant } from '../entities/restaurant.entity';
import { IsUUID } from 'class-validator';

@InputType()
export class RestaurantInput {
  @Field(() => String)
  @IsUUID()
  restaurantId!: string;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  restaurant!: Restaurant | null;
}
