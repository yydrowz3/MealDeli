import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { LessThan, Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import {
    CreatePaymentInput,
    CreatePaymentOutput,
} from "./dtos/create-payment.dto";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { GetPaymentsOutput } from "./dtos/get-payments.dto";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly payments: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>
    ) {}

    async createPayment(
        owner: User,
        { transactionId, restaurantId }: CreatePaymentInput
    ): Promise<CreatePaymentOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }

            if (restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: "You are not allowed to create payment if you are not owner",
                };
            }
            await this.payments.save(
                this.payments.create({
                    transactionId,
                    user: owner,
                    restaurant,
                })
            );

            restaurant.isPromoted = true;
            const date = new Date();
            const daysIncrement = 7;
            date.setDate(date.getDate() + daysIncrement);
            restaurant.promotedUntil = date;
            await this.restaurants.save(restaurant);

            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not create payment",
            };
        }
    }

    async getPayments(user: User): Promise<GetPaymentsOutput> {
        try {
            const payments = await this.payments.find({
                where: { user: { id: user.id } },
            });
            return {
                ok: true,
                payments,
            };
        } catch {
            return {
                ok: false,
                error: "Could not get payments",
            };
        }
    }

    // @Interval(2000)
    @Cron("0 0 * * *")
    async checkPromotedRestaurants() {
        const restaurants = await this.restaurants.find({
            where: { isPromoted: true, promotedUntil: LessThan(new Date()) },
        });
        restaurants.forEach(async (restaurant) => {
            restaurant.isPromoted = false;
            restaurant.promotedUntil = undefined;
            await this.restaurants.save(restaurant);
        });
    }
}
