import { DEFAULT_PAGE, MAX_PAGE } from '@/common/pagination/page.constants';
import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

@InputType({ isAbstract: true })
export abstract class PageInput {
  @Field(() => Int, { defaultValue: DEFAULT_PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE)
  page: number = DEFAULT_PAGE;
}
