import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';

@ObjectType()
export class Category extends CoreEntity {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field(() => String)
  slug!: string;

  @Field(() => Int)
  restaurantCount?: number;
}
