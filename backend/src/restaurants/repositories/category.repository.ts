import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

// @EntityRepository(Category)
// export class CategoryRepository extends Repository<Category> {
//     async getOrCreate(name: string): Promise<Category> {
//         console.log(name);

//         const categoryName = name.trim().toLowerCase();
//         const categorySlug = categoryName.replace(/ /g, "-");
//         let category = await this.findOne({
//             where: { slug: categorySlug },
//         });
//         if (!category) {
//             category = await this.save(
//                 this.create({
//                     slug: categorySlug,
//                     name: categoryName,
//                 })
//             );
//         }

//         return category;
//     }
// }

@Injectable()
export class CategoryRepository {
    constructor(
        @InjectRepository(Category)
        private readonly categories: Repository<Category>
    ) {}

    async getOrCreate(name: string): Promise<Category> {
        console.log(name);

        const categoryName = name.trim().toLowerCase();
        const categorySlug = categoryName.replace(/ /g, "-");
        let category = await this.categories.findOne({
            where: { slug: categorySlug },
        });
        if (!category) {
            category = await this.categories.create(
                this.categories.create({
                    slug: categorySlug,
                    name: categoryName,
                })
            );
            category = await this.categories.save(category);
        }

        return category;
    }
}
