import { Injectable } from "@nestjs/common";
import { CreateRestaurantInput } from "./dto/create-restaurant.input";
import { UpdateRestaurantInput } from "./dto/update-restaurant.input";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RestaurantsService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createRestaurantInput: CreateRestaurantInput) {
    return "This action adds a new restaurant";
  }

  findAll() {
    return `This action returns all restaurants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} restaurant`;
  }

  update(id: number, updateRestaurantInput: UpdateRestaurantInput) {
    return `This action updates a #${id} restaurant`;
  }

  remove(id: number) {
    return `This action removes a #${id} restaurant`;
  }
}
