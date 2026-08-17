import { describe, expect, it } from "vitest";

import { CART_STORAGE_KEY } from "./types";
import { createMemoryStringStorage, createValidatedCartStorage } from "./cart-storage";
import {
  addCartLineAtom,
  cartAtom,
  cartCountAtom,
  cartTotalMinorAtom,
  changeCartQuantityAtom,
  clearCartAtom,
  createCartTestStore,
  removeCartLineAtom,
  replaceRestaurantCartAtom,
} from "./cart-atoms";
import { cartStateSchema, EMPTY_CART } from "./cart-schema";
import { buildCart, buildCartLine } from "../testing/fixtures";

describe("validated cart storage", () => {
  it("hydrates a valid v1 cart", () => {
    const cart = buildCart();
    const storage = createMemoryStringStorage({ [CART_STORAGE_KEY]: JSON.stringify(cart) });
    expect(createValidatedCartStorage(storage).getItem(CART_STORAGE_KEY, EMPTY_CART)).toEqual(cart);
  });

  it.each([
    ["damaged JSON", "{"],
    ["unknown version", JSON.stringify({ ...buildCart(), version: 2 })],
    ["unsafe cents", JSON.stringify(buildCart({ lines: [buildCartLine({ basePriceMinor: Number.MAX_VALUE })] }))],
    [
      "unsafe derived total",
      JSON.stringify(
        buildCart({
          lines: [buildCartLine({ basePriceMinor: Number.MAX_SAFE_INTEGER, options: [], quantity: 2 })],
        }),
      ),
    ],
    ["invalid quantity", JSON.stringify(buildCart({ lines: [buildCartLine({ quantity: 0 })] }))],
  ])("clears %s", (_label, raw) => {
    const storage = createMemoryStringStorage({ [CART_STORAGE_KEY]: raw });
    expect(createValidatedCartStorage(storage).getItem(CART_STORAGE_KEY, EMPTY_CART)).toEqual(EMPTY_CART);
    expect(storage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("rejects inconsistent and duplicate snapshots", () => {
    expect(cartStateSchema.safeParse({ version: 1, restaurant: null, lines: [buildCartLine()] }).success).toBe(false);
    expect(cartStateSchema.safeParse(buildCart({ lines: [buildCartLine(), buildCartLine()] })).success).toBe(false);
    expect(
      cartStateSchema.safeParse(
        buildCart({
          lines: [
            buildCartLine({
              options: [
                { optionId: "same", name: "One", choices: [] },
                { optionId: "same", name: "Two", choices: [] },
              ],
            }),
          ],
        }),
      ).success,
    ).toBe(false);
    expect(
      cartStateSchema.safeParse(
        buildCart({
          lines: [
            buildCartLine({
              options: [
                {
                  optionId: "option",
                  name: "Option",
                  choices: [
                    { choiceId: "same", name: "One", extraMinor: 0 },
                    { choiceId: "same", name: "Two", extraMinor: 0 },
                  ],
                },
              ],
            }),
          ],
        }),
      ).success,
    ).toBe(false);
  });
});

describe("cart atoms", () => {
  it("adds, merges deterministic selections, changes quantity, removes, and clears", () => {
    const store = createCartTestStore();
    const restaurant = { id: "restaurant-seoul-kitchen", name: "Seoul Kitchen" };
    expect(store.set(addCartLineAtom, { restaurant, line: buildCartLine() })).toEqual({ kind: "ADDED" });
    expect(
      store.set(addCartLineAtom, {
        restaurant,
        line: buildCartLine({
          lineId: "another-id",
          options: [
            {
              optionId: "option-heat",
              name: "Renamed snapshot",
              choices: [{ choiceId: "choice-spicy", name: "Very spicy", extraMinor: 150 }],
            },
          ],
          quantity: 2,
        }),
      }),
    ).toEqual({ kind: "MERGED" });
    expect(store.get(cartCountAtom)).toBe(3);
    expect(store.get(cartTotalMinorAtom)).toBe((1_299 + 150) * 3);
    store.set(changeCartQuantityAtom, { lineId: "line-bibimbap", quantity: 99 });
    expect(store.get(cartCountAtom)).toBe(99);
    expect(store.set(addCartLineAtom, { restaurant, line: buildCartLine() })).toEqual({ kind: "QUANTITY_LIMIT" });
    store.set(removeCartLineAtom, "line-bibimbap");
    expect(store.get(cartAtom)).toEqual(EMPTY_CART);
    store.set(addCartLineAtom, { restaurant, line: buildCartLine() });
    store.set(clearCartAtom);
    expect(store.get(cartAtom)).toEqual(EMPTY_CART);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("does not mutate before cross-restaurant confirmation", () => {
    const original = buildCart();
    const store = createCartTestStore({ initialState: original });
    const next = {
      restaurant: { id: "restaurant-tacos", name: "Taco Town" },
      line: buildCartLine({ lineId: "line-taco", dishId: "dish-taco", dishName: "Taco" }),
    };
    expect(store.set(addCartLineAtom, next)).toMatchObject({
      kind: "REQUIRES_REPLACEMENT_CONFIRMATION",
    });
    expect(store.get(cartAtom)).toEqual(original);
    store.set(replaceRestaurantCartAtom, next);
    expect(store.get(cartAtom)).toEqual({ version: 1, restaurant: next.restaurant, lines: [next.line] });
  });

  it("isolates stores", () => {
    const first = createCartTestStore();
    const second = createCartTestStore();
    first.set(addCartLineAtom, {
      restaurant: { id: "restaurant-seoul-kitchen", name: "Seoul Kitchen" },
      line: buildCartLine(),
    });
    expect(first.get(cartCountAtom)).toBe(1);
    expect(second.get(cartCountAtom)).toBe(0);
  });

  it("persists an injected memory storage and removes it on clear", () => {
    const storage = createMemoryStringStorage();
    const store = createCartTestStore({ storage });
    store.set(addCartLineAtom, {
      restaurant: { id: "restaurant-seoul-kitchen", name: "Seoul Kitchen" },
      line: buildCartLine(),
    });
    expect(JSON.parse(storage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual(buildCart());
    store.set(clearCartAtom);
    expect(storage.getItem(CART_STORAGE_KEY)).toBeNull();
  });
});
