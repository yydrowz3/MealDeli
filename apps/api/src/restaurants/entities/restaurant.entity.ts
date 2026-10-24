import { ObjectType, Field } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { Dish } from './dish.entity';
import { Category } from './category.entity';

@ObjectType()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  address!: string;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field(() => Date, { nullable: true })
  promotedUntil!: Date | null;

  @Field(() => String)
  ownerId!: string;

  @Field(() => String)
  categoryId!: string;

  @Field(() => Category)
  category?: Category;

  @Field(() => [Dish])
  dishes?: Dish[];
}
