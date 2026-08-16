import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dto/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';
import { Category } from '../entities/category.entity';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CategoryInput extends PaginationInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  slug!: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants!: Restaurant[] | null;

  @Field(() => Category, { nullable: true })
  category!: Category | null;
}
