import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from '../../common/dto/output.dto';
import { EditDishOptionInput } from '../entities/dish-option.entity';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'priceMinor',
  'description',
]) {
  @Field(() => String)
  dishId!: string;

  @Field(() => [EditDishOptionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @Type(() => EditDishOptionInput)
  @ValidateNested({ each: true })
  options?: EditDishOptionInput[];
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
