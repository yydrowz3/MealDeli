import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'priceMinor',
  'description',
]) {
  @Field(() => String)
  dishId!: string;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
