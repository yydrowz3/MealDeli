import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from '../../common/dto/output.dto';
import { CreateDishOptionInput } from '../entities/dish-option.entity';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'priceMinor',
  'description',
  'image',
]) {
  @Field(() => String)
  restaurantId!: string;

  @Field(() => [CreateDishOptionInput])
  @IsArray()
  @Type(() => CreateDishOptionInput)
  @ValidateNested({ each: true })
  options!: CreateDishOptionInput[];
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
