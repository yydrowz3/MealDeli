import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { Category } from "./category.entity";
import { User } from "src/users/entities/user.entity";
import { Dish } from "./dish.entity";
import { Order } from "src/orders/entities/order.entity";

@InputType("RestaurantInputType", { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    // @PrimaryGeneratedColumn()
    // @Field((is) => Number)
    // id: number;

    @Field((is) => String)
    @Column()
    @IsString()
    name: string;

    // @Field(is => Boolean, {nullable: true})
    // isGood?: boolean;

    // @Field((is) => Boolean, { nullable: true })
    // @Column({ default: true })
    // @IsOptional()
    // @IsBoolean()
    // isVegan: boolean;

    @Field((is) => String)
    @Column()
    @IsString()
    address: string;

    // @Field((is) => String)
    // @Column()
    // ownerName: string;

    // @Field((is) => String)
    // @Column()
    // categoryName: string;

    @Field((type) => String)
    @Column()
    @IsString()
    coverImg: string;

    @Field((type) => Category, { nullable: true })
    @ManyToOne((type) => Category, (category) => category.restaurants, {
        onDelete: "CASCADE",
    })
    category: Category;

    @Field((type) => User)
    @ManyToOne((type) => User, (user) => user.restaurants)
    owner: User;

    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;

    @Field((type) => [Dish])
    @OneToMany((type) => Dish, (dish) => dish.restaurant)
    menu: Dish[];

    @Field((type) => [Order])
    @OneToMany((type) => Order, (order) => order.restaurant)
    orders: Order[];

    @Field((type) => Boolean)
    @Column({ default: false })
    isPromoted: boolean;

    @Field((type) => Date, { nullable: true })
    @Column({ nullable: true })
    promotedUntil?: Date;
}
