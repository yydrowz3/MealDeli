import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CoreOutput } from '../../common/dto/output.dto';

@InputType()
export class UpdateCategoryInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string | null;
}

@ObjectType()
export class UpdateCategoryOutput extends CoreOutput {}
