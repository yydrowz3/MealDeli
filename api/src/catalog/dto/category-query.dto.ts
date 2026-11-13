import { CategoryModel } from '../models/category.model';
import { RestaurantModel } from '../models/restaurant.model';
import { OperationPayload } from '@/common/dto/operation.payload';
import { PageInput } from '@/common/pagination/page.input';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CategoryInput extends PageInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  slug!: string;
}

@InputType()
export class SearchRestaurantInput extends PageInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  query!: string;
}

@ObjectType()
export class AllCategoriesPayload extends OperationPayload {
  @Field(() => [CategoryModel])
  categories: CategoryModel[] = [];
}

@ObjectType()
export class CategoryPayload extends OperationPayload {
  @Field(() => CategoryModel, { nullable: true })
  category?: CategoryModel;

  @Field(() => [RestaurantModel])
  restaurants: RestaurantModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}

@ObjectType()
export class SearchRestaurantPayload extends OperationPayload {
  @Field(() => [RestaurantModel])
  restaurants: RestaurantModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}
