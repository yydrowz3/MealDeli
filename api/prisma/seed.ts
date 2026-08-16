import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { Prisma, PrismaClient, UserRole } from '../src/generated/prisma/client';

type SeedUser = {
  email: string;
  password: string;
  role: UserRole;
};

type SeedCategory = {
  name: string;
  slug: string;
  image: string | null;
};

type SeedRestaurant = {
  name: string;
  address: string;
  image: string | null;
  slug: string;
};

type SeedDish = {
  name: string;
  price: number;
  description: string;
  photo?: string | null;
  options: string | null;
};

type SeedOption = {
  name: string;
  minSelections?: number;
  maxSelections?: number;
  extra?: number;
  choices?: Array<{
    name: string;
    extra: number;
  }>;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function loadJson<T>(fileName: string): Promise<T> {
  const json = await readFile(resolve('prisma', 'sample_data', fileName), 'utf8');
  return JSON.parse(json) as T;
}

function toDishOptions(options: string | null): Prisma.InputJsonValue {
  if (!options) {
    return [];
  }

  const parsed = JSON.parse(options) as SeedOption[];
  const normalized = parsed.map((option) => {
    const choices = option.choices ?? [
      {
        name: option.name,
        extra: option.extra ?? 0,
      },
    ];

    return {
      id: randomUUID(),
      name: option.name,
      minSelections: option.minSelections ?? 0,
      maxSelections: option.maxSelections ?? choices.length,
      choices: choices.map((choice) => ({
        id: randomUUID(),
        name: choice.name,
        extraMinor: choice.extra,
      })),
    };
  });

  return normalized as Prisma.InputJsonValue;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const [users, categories, restaurants, dishes] = await Promise.all([
    loadJson<SeedUser[]>('user.json'),
    loadJson<SeedCategory[]>('category.json'),
    loadJson<SeedRestaurant[]>('restaurant.json'),
    loadJson<SeedDish[]>('dish.json'),
  ]);

  const verifiedAt = new Date();
  const testOwner = {
    email: 'test_owner@mealdeli.com',
    password: 'test_owner',
    role: UserRole.OWNER,
  };

  for (const user of [...users, testOwner]) {
    const passwordHash = await argon2.hash(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        name: user.email.split('@')[0],
        role: user.role,
        verifiedAt,
      },
      create: {
        email: user.email,
        passwordHash,
        name: user.email.split('@')[0],
        role: user.role,
        verifiedAt,
      },
    });
  }

  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: testOwner.email },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        image: category.image,
      },
      create: category,
    });
  }

  const categoryBySlug = new Map(
    (
      await prisma.category.findMany({
        where: { slug: { in: categories.map((category) => category.slug) } },
        select: { id: true, slug: true },
      })
    ).map((category) => [category.slug, category.id]),
  );

  for (const restaurant of restaurants) {
    const categoryId = categoryBySlug.get(restaurant.slug);
    if (!categoryId) {
      throw new Error(`Category not found for restaurant: ${restaurant.name}`);
    }

    const existing = await prisma.restaurant.findFirst({
      where: { name: restaurant.name },
      select: { id: true },
    });
    const data = {
      ownerId: owner.id,
      categoryId,
      name: restaurant.name,
      address: restaurant.address,
      image: restaurant.image,
    };

    if (existing) {
      await prisma.restaurant.update({ where: { id: existing.id }, data });
    } else {
      await prisma.restaurant.create({ data });
    }
  }

  const smashHead = await prisma.restaurant.findFirstOrThrow({
    where: { name: 'SMASH HEAD' },
    select: { id: true },
  });

  for (const dish of dishes) {
    const existing = await prisma.dish.findFirst({
      where: {
        restaurantId: smashHead.id,
        name: dish.name,
      },
      select: { id: true },
    });
    const data = {
      restaurantId: smashHead.id,
      name: dish.name,
      description: dish.description,
      priceMinor: dish.price,
      image: dish.photo ?? null,
      options: toDishOptions(dish.options),
    };

    if (existing) {
      await prisma.dish.update({ where: { id: existing.id }, data });
    } else {
      await prisma.dish.create({ data });
    }
  }

  console.log(
    `Seeded ${users.length + 1} users, ${categories.length} categories, ${restaurants.length} restaurants, and ${dishes.length} dishes.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
