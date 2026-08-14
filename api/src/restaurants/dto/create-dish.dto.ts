import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'priceMinor',
  'options',
  'description',
  'image',
]) {
  @Field(() => String)
  restaurantId!: string;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
