import { Injectable } from "@nestjs/common";
import { Restaurant } from "./entities/restaurant.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository } from "typeorm";
import {
    CreateRestaurantInput,
    CreateRestaurantOutput,
} from "./dtos/create-restaurant.dto";
import { User } from "src/users/entities/user.entity";
import { Category } from "./entities/category.entity";
import {
    EditRestaurantInput,
    EditRestaurantOutput,
} from "./dtos/edit-restaurant.dto";
// import { CategoryRepository } from "./repositories/category.repository";
import {
    DeleteRestaurantInput,
    DeleteRestaurantOutput,
} from "./dtos/delete-restaurant.dto";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import {
    SearchRestaurantInput,
    SearchRestaurantOutput,
} from "./dtos/search-restaurant.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dist.dto";
import { Dish } from "./entities/dish.entity";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import { MyRestaurantsOutput } from "./dtos/my-restaurants.dto";
import {
    MyRestaurantInput,
    MyRestaurantOutput,
} from "./dtos/my-restaurant.dto";

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant) // const userRepository = connection.getRepository(User);
        private readonly restaurants: Repository<Restaurant>,
        // private readonly categoriesRepository: CategoryRepository,
        @InjectRepository(Category)
        private readonly categories: Repository<Category>,
        @InjectRepository(Dish) private readonly dishes: Repository<Dish>
    ) {}
    // getAll(): Promise<Restaurant[]> {
    //     return this.restaurant.find();
    // }

    // async getOrCreate(name: string): Promise<Category> {
    //     const categoryName = name.trim().toLowerCase();
    //     const categorySlug = categoryName.replace(/ /g, "-");
    //     let category = await this.categories.findOne({
    //         where: { slug: categorySlug },
    //     });
    //     if (!category) {
    //         category = await this.categories.save(
    //             this.categories.create({
    //                 slug: categorySlug,
    //                 name: categoryName,
    //             })
    //         );
    //     }

    //     return category;
    // }

    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        // const newRestaurant = new Restaurant();
        // newRestaurant.name = createRestaurantDto.name;
        // const newRestaurant = this.restaurant.create(createRestaurantInput);
        // return this.restaurant.save(newRestaurant);
        try {
            const newRestaurant = this.restaurants.create(
                createRestaurantInput
            );
            newRestaurant.owner = owner;

            const categoryName = createRestaurantInput.categoryName
                .trim()
                .toLowerCase();
            const categorySlug = categoryName.replace(/ /g, "-");
            let category = await this.categories.findOne({
                where: { slug: categorySlug },
            });
            if (!category) {
                category = await this.categories.save(
                    this.categories.create({
                        slug: categorySlug,
                        name: categoryName,
                    })
                );
            }
            // const category = await this.categoriesRepository.getOrCreate(
            //     createRestaurantInput.categoryName
            // );
            newRestaurant.category = category;
            console.log(category);

            await this.restaurants.save(newRestaurant);
            return {
                ok: true,
                restaurantId: newRestaurant.id,
            };
        } catch (e) {
            console.log(e);
            return {
                ok: false,
                error: "Could not create restaurant",
            };
        }
    }

    async editRestaurant(
        owner: User,
        editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: editRestaurantInput.restaurantId },
                // loadRelationIds: true,
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't edit a restaurant that you don't own",
                };
            }
            let category: Category | null = null;
            if (editRestaurantInput.categoryName) {
                // category = await this.categoriesRepository.getOrCreate(
                //     editRestaurantInput.categoryName
                // );

                const categoryName = editRestaurantInput.categoryName
                    .trim()
                    .toLowerCase();
                const categorySlug = categoryName.replace(/ /g, "-");
                category = await this.categories.findOne({
                    where: { slug: categorySlug },
                });
                if (!category) {
                    category = await this.categories.save(
                        this.categories.create({
                            slug: categorySlug,
                            name: categoryName,
                        })
                    );
                }
            }
            await this.restaurants.save([
                {
                    id: editRestaurantInput.restaurantId,
                    ...editRestaurantInput,
                    ...(category && { category }),
                },
            ]);

            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not edit restaurant",
            };
        }
    }

    // updateRestaurant({ id, data }: UpdateRestaurantDto) {
    //     return this.restaurant.update(id, { ...data }); // won't check if exist
    // }

    async deleteRestaurant(
        owner: User,
        { restaurantId }: DeleteRestaurantInput
    ): Promise<DeleteRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
                // loadRelationIds: true,
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't delete a restaurant that you don't own",
                };
            }
            await this.restaurants.delete(restaurantId);
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not delete restaurant",
            };
        }
    }

    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find();
            return {
                ok: true,
                categories,
            };
        } catch {
            return {
                ok: false,
                error: "Could not load categories",
            };
        }
    }

    async countRestaurants(category: Category) {
        return await this.restaurants.count({
            where: { category: { id: category.id } },
        });
    }

    async findCategoryBySlug({
        slug,
        page,
    }: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({
                where: { slug },
                // relations: ["restaurants"],
            });
            if (!category) {
                return {
                    ok: false,
                    error: "Category not found",
                };
            }

            const restaurants = await this.restaurants.find({
                where: {
                    category: { id: category.id },
                },
                order: {
                    isPromoted: "DESC",
                },
                take: 15,
                skip: (page - 1) * 15,
            });
            category.restaurants = restaurants;
            const totalResults = await this.countRestaurants(category);
            return {
                ok: true,
                restaurants,
                totalResults,
                category,
                totalPages: Math.ceil(totalResults / 15),
            };
        } catch {
            return {
                ok: false,
                error: "Could not load category",
            };
        }
    }

    async allRestaurants({
        page,
    }: RestaurantsInput): Promise<RestaurantsOutput> {
        try {
            const [restaurants, totalResults] =
                await this.restaurants.findAndCount({
                    skip: (page - 1) * 15,
                    take: 15,
                    order: {
                        isPromoted: "DESC",
                    },
                });
            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / 15),
                totalResults,
            };
        } catch {
            return {
                ok: false,
                error: "Could not load restaurants",
            };
        }
    }

    async findRestaurantById({
        restaurantId,
    }: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: restaurantId },
                relations: ["menu"],
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            return {
                ok: true,
                restaurant,
            };
        } catch {
            return {
                ok: false,
                error: "Could not find restaurant",
            };
        }
    }

    async searchRestaurantByName({
        query,
        page,
    }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] =
                await this.restaurants.findAndCount({
                    where: {
                        name: Raw((name) => `${name} ILIKE '%${query}%'`),
                    },
                    skip: (page - 1) * 15,
                    take: 15,
                });

            return {
                ok: true,
                restaurants,
                totalResults,
                totalPages: Math.ceil(totalResults / 15),
            };
        } catch {
            return {
                ok: false,
                error: "Could not search for restaurants",
            };
        }
    }

    async createDish(
        owner: User,
        createDishInput: CreateDishInput
    ): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: createDishInput.restaurantId },
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You cannot do that.",
                };
            }

            await this.dishes.save(
                this.dishes.create({ ...createDishInput, restaurant })
            );
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not create dish",
            };
        }
    }

    async editDish(
        owner: User,
        editDishInput: EditDishInput // don't open cuz if it is null
    ): Promise<EditDishOutput> {
        try {
            const dish = await this.dishes.findOne({
                where: { id: editDishInput.dishId },
                relations: ["restaurant"],
            });
            if (!dish) {
                return {
                    ok: false,
                    error: "Dish not found",
                };
            }
            if (dish.restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: "You can't edit a dish that you don't own",
                };
            }
            await this.dishes.save([
                {
                    id: editDishInput.dishId,
                    ...editDishInput,
                },
            ]);
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not edit dish",
            };
        }
    }

    async deleteDish(
        owner: User,
        deleteDishInput: DeleteDishInput
    ): Promise<DeleteDishOutput> {
        try {
            const dish = await this.dishes.findOne({
                where: { id: deleteDishInput.dishId },
                relations: ["restaurant"],
            });
            if (!dish) {
                return {
                    ok: false,
                    error: "Dish not found",
                };
            }
            if (dish.restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: "You can't delete a dish that you don't own",
                };
            }
            await this.dishes.delete(deleteDishInput.dishId);
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not delete dish",
            };
        }
    }

    async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
        try {
            const restaurants = await this.restaurants.find({
                where: { owner: { id: owner.id } },
            });

            return {
                ok: true,
                restaurants,
            };
        } catch (e) {
            console.log(e);
            return {
                ok: false,
                error: "Could not find restaurants",
            };
        }
    }

    async myRestaurant(
        owner: User,
        { id }: MyRestaurantInput
    ): Promise<MyRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { owner: { id: owner.id }, id: id },
                relations: ["menu", "orders"],
            });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            return {
                ok: true,
                restaurant,
            };
        } catch {
            return {
                ok: false,
                error: "Could not find restaurant",
            };
        }
    }
}
