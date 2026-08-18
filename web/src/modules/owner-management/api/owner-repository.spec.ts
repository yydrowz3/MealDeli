import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { describe, expect, it } from "vitest";

import {
  createOwnerRestaurantRepository,
  type OwnerManagementGraphqlTransport,
} from "./owner-repository";

const restaurant = {
  __typename: "Restaurant",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Noodle House",
  address: "1 Main Street",
  image: null,
  promotedUntil: null,
  categoryId: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-11T10:00:00.000Z",
  category: {
    __typename: "Category",
    id: "22222222-2222-4222-8222-222222222222",
    name: "Noodles",
    slug: "noodles",
  },
  dishes: [
    {
      __typename: "Dish",
      id: "33333333-3333-4333-8333-333333333333",
      restaurantId: "11111111-1111-4111-8111-111111111111",
      name: "Beef noodles",
      description: "Slow cooked beef",
      priceMinor: 1299,
      image: null,
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-08-11T10:00:00.000Z",
      options: [
        {
          __typename: "DishOption",
          id: "44444444-4444-4444-8444-444444444444",
          name: "Spice",
          minSelections: 1,
          maxSelections: 1,
          choices: [
            {
              __typename: "DishChoice",
              id: "55555555-5555-4555-8555-555555555555",
              name: "Mild",
              extraMinor: 0,
            },
          ],
        },
      ],
    },
  ],
};

class QueueTransport implements OwnerManagementGraphqlTransport {
  readonly calls: { document: unknown; variables: unknown }[] = [];
  private responses: unknown[];

  constructor(responses: unknown[]) {
    this.responses = [...responses];
  }

  async execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    this.calls.push({ document, variables });
    return this.responses.shift() as TResult;
  }
}

describe("owner restaurant repository", () => {
  it("refreshes the authoritative owner restaurant after create", async () => {
    const transport = new QueueTransport([
      { createRestaurant: { ok: true, error: null, restaurantId: restaurant.id } },
      { myRestaurant: { ok: true, error: null, restaurant } },
    ]);
    const repository = createOwnerRestaurantRepository(transport);
    const result = await repository.create({
      name: restaurant.name,
      categoryId: restaurant.categoryId,
      address: restaurant.address,
      image: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.dishes[0]?.options[0]?.choices[0]?.id).toBe(
        "55555555-5555-4555-8555-555555555555",
      );
    }
    expect(transport.calls).toHaveLength(2);
  });

  it("preserves existing option ids, omits ids for new choices, and refetches after edit", async () => {
    const transport = new QueueTransport([
      { editDish: { ok: true, error: null } },
      { myRestaurant: { ok: true, error: null, restaurant } },
    ]);
    const repository = createOwnerRestaurantRepository(transport);
    const result = await repository.updateDish(restaurant.dishes[0]!.id, restaurant.id, {
      name: "Beef noodles",
      description: "Slow cooked beef",
      priceMinor: 1299,
      image: null,
      options: [
        {
          id: restaurant.dishes[0]!.options[0]!.id,
          name: "Spice",
          minSelections: 1,
          maxSelections: 1,
          choices: [{ name: "Hot", extraMinor: 50 }],
        },
      ],
    });
    expect(result.ok).toBe(true);
    const variables = transport.calls[0]!.variables as {
      input: { options: { id?: string; choices: { id?: string }[] }[] };
    };
    expect(variables.input.options[0]?.id).toBe("44444444-4444-4444-8444-444444444444");
    expect(variables.input.options[0]?.choices[0]).not.toHaveProperty("id");
    expect(transport.calls).toHaveLength(2);
  });

  it("does not refetch after a rejected delete mutation", async () => {
    const transport = new QueueTransport([
      { deleteDish: { ok: false, error: "Could not delete dish." } },
    ]);
    const result = await createOwnerRestaurantRepository(transport).deleteDish(
      restaurant.dishes[0]!.id,
      restaurant.id,
    );
    expect(result).toEqual({ ok: false, message: "Could not delete dish." });
    expect(transport.calls).toHaveLength(1);
  });

  it("lists and gets only authoritative owner restaurants", async () => {
    const transport = new QueueTransport([
      { myRestaurants: { ok: true, error: null, restaurants: [restaurant] } },
      { myRestaurant: { ok: true, error: null, restaurant } },
      { myRestaurant: { ok: false, error: "Restaurant not found", restaurant: null } },
    ]);
    const repository = createOwnerRestaurantRepository(transport);
    await expect(repository.list()).resolves.toHaveLength(1);
    await expect(repository.get(restaurant.id)).resolves.toMatchObject({ id: restaurant.id });
    await expect(repository.get("missing")).resolves.toBeNull();
  });

  it("normalizes list/get permission and transport failures", async () => {
    const deniedList = createOwnerRestaurantRepository(
      new QueueTransport([{ myRestaurants: { ok: false, error: "Permission denied" } }]),
    );
    await expect(deniedList.list()).rejects.toThrow("Restaurant not found.");

    const failedGet = createOwnerRestaurantRepository(
      new QueueTransport([
        { myRestaurant: { ok: false, error: "Database unavailable", restaurant: null } },
      ]),
    );
    await expect(failedGet.get(restaurant.id)).rejects.toThrow("Database unavailable");

    const transport: OwnerManagementGraphqlTransport = {
      execute: async () => {
        throw new Error("offline");
      },
    };
    await expect(createOwnerRestaurantRepository(transport).list()).rejects.toHaveProperty(
      "name",
      "OwnerManagementRepositoryError",
    );
  });

  it("covers restaurant update/delete success and business failures", async () => {
    const success = createOwnerRestaurantRepository(
      new QueueTransport([
        { editRestaurant: { ok: true, error: null } },
        { myRestaurant: { ok: true, error: null, restaurant } },
        { deleteRestaurant: { ok: true, error: null } },
      ]),
    );
    await expect(
      success.update(restaurant.id, { name: "Updated", address: "2 Main Street", image: null }),
    ).resolves.toMatchObject({ ok: true });
    await expect(success.delete(restaurant.id)).resolves.toEqual({ ok: true, value: undefined });

    const failure = createOwnerRestaurantRepository(
      new QueueTransport([
        { createRestaurant: { ok: false, error: "Duplicate restaurant", restaurantId: null } },
        { editRestaurant: { ok: false, error: "don't own restaurant" } },
        { deleteRestaurant: { ok: false, error: null } },
      ]),
    );
    await expect(
      failure.create({ name: "N", categoryId: "category", address: "A", image: null }),
    ).resolves.toEqual({ ok: false, message: "Duplicate restaurant" });
    await expect(
      failure.update(restaurant.id, { name: "N", address: "A", image: null }),
    ).resolves.toEqual({ ok: false, message: "Restaurant not found." });
    await expect(failure.delete(restaurant.id)).resolves.toEqual({
      ok: false,
      message: "We couldn’t delete this restaurant.",
    });
  });

  it("covers create, update, and delete dish command outcomes", async () => {
    const draft = {
      name: "Soup",
      description: "Warm soup",
      priceMinor: 500,
      image: null,
      options: [
        {
          name: "Size",
          minSelections: 1,
          maxSelections: 1,
          choices: [{ name: "Regular", extraMinor: 0 }],
        },
      ],
    };
    const success = createOwnerRestaurantRepository(
      new QueueTransport([
        { createDish: { ok: true, error: null } },
        { myRestaurant: { ok: true, error: null, restaurant } },
        { deleteDish: { ok: true, error: null } },
        { myRestaurant: { ok: true, error: null, restaurant } },
      ]),
    );
    await expect(success.createDish(restaurant.id, draft)).resolves.toMatchObject({ ok: true });
    await expect(
      success.deleteDish(restaurant.dishes[0]!.id, restaurant.id),
    ).resolves.toMatchObject({
      ok: true,
    });

    const failure = createOwnerRestaurantRepository(
      new QueueTransport([
        { createDish: { ok: false, error: null } },
        { editDish: { ok: false, error: "Permission denied" } },
      ]),
    );
    await expect(failure.createDish(restaurant.id, draft)).resolves.toEqual({
      ok: false,
      message: "We couldn’t add this dish.",
    });
    await expect(
      failure.updateDish(restaurant.dishes[0]!.id, restaurant.id, draft),
    ).resolves.toEqual({ ok: false, message: "Restaurant not found." });
  });
});
