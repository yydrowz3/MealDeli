import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { IsOptional, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Dish } from './dish.entity';
import { Category } from './category.entity';
import { Payment } from '../../payments/entities/payment.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => String)
  @IsString()
  address!: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  @IsString()
  image!: string | null;

  @Field(() => Date, { nullable: true })
  promotedUntil!: Date | null;

  @Field(() => String)
  ownerId!: string;

  @Field(() => User)
  owner?: User;

  @Field(() => String)
  categoryId!: string;

  @Field(() => Category)
  category?: Category;

  @Field(() => [Dish])
  dishes?: Dish[];

  @Field(() => [Payment])
  payments?: Payment[];

  // orders
}
