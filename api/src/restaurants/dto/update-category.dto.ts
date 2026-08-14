import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import { IsOptional, IsString } from 'class-validator';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class UpdateCategoryInput extends PickType(Category, ['id']) {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  image?: string | null;
}

@ObjectType()
export class UpdateCategoryOutput extends CoreOutput {}
