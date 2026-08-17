import { atom } from "jotai";
import { createStore } from "jotai/vanilla";
import { atomWithStorage, RESET } from "jotai/utils";

import { cartLineSchema, cartStateSchema, EMPTY_CART } from "./cart-schema";
import { getCartCount, getCartSelectionKey, getCartTotalMinor } from "./cart-selectors";
import { createMemoryStringStorage, createValidatedCartStorage } from "./cart-storage";
import type {
  AddCartLineInput,
  AddCartLineResult,
  CartState,
  ChangeQuantityInput,
} from "./types";
import { CART_STORAGE_KEY } from "./types";

const browserStorage =
  typeof window === "undefined" ? createMemoryStringStorage() : window.localStorage;

export const cartStorageAtom = atomWithStorage<CartState>(
  CART_STORAGE_KEY,
  EMPTY_CART,
  createValidatedCartStorage(browserStorage),
  { getOnInit: true },
);

export const cartAtom = atom((get) => get(cartStorageAtom));
export const cartCountAtom = atom((get) => getCartCount(get(cartAtom)));
export const cartTotalMinorAtom = atom((get) => getCartTotalMinor(get(cartAtom)));

export const addCartLineAtom = atom<null, [AddCartLineInput], AddCartLineResult>(
  null,
  (get, set, input) => {
    const line = cartLineSchema.parse(input.line);
    const current = get(cartStorageAtom);
    if (current.restaurant && current.restaurant.id !== input.restaurant.id) {
      return {
        kind: "REQUIRES_REPLACEMENT_CONFIRMATION",
        currentRestaurant: current.restaurant,
        nextRestaurant: input.restaurant,
      };
    }

    const matchIndex = current.lines.findIndex(
      (candidate) => getCartSelectionKey(candidate) === getCartSelectionKey(line),
    );
    if (matchIndex >= 0) {
      const match = current.lines[matchIndex];
      if (match.quantity + line.quantity > 99) return { kind: "QUANTITY_LIMIT" };
      const lines = current.lines.map((candidate, index) =>
        index === matchIndex ? { ...candidate, quantity: candidate.quantity + line.quantity } : candidate,
      );
      set(cartStorageAtom, cartStateSchema.parse({ ...current, lines }));
      return { kind: "MERGED" };
    }

    set(
      cartStorageAtom,
      cartStateSchema.parse({
        version: 1,
        restaurant: current.restaurant ?? input.restaurant,
        lines: [...current.lines, line],
      }),
    );
    return { kind: "ADDED" };
  },
);

export const replaceRestaurantCartAtom = atom<null, [AddCartLineInput], void>(
  null,
  (_get, set, input) => {
    const line = cartLineSchema.parse(input.line);
    set(
      cartStorageAtom,
      cartStateSchema.parse({ version: 1, restaurant: input.restaurant, lines: [line] }),
    );
  },
);

export const changeCartQuantityAtom = atom<null, [ChangeQuantityInput], void>(
  null,
  (get, set, input) => {
    const quantity = Math.min(99, Math.max(1, Math.trunc(input.quantity)));
    const current = get(cartStorageAtom);
    if (!current.lines.some((line) => line.lineId === input.lineId)) return;
    set(
      cartStorageAtom,
      cartStateSchema.parse({
        ...current,
        lines: current.lines.map((line) =>
          line.lineId === input.lineId ? { ...line, quantity } : line,
        ),
      }),
    );
  },
);

export const removeCartLineAtom = atom<null, [string], void>(null, (get, set, lineId) => {
  const current = get(cartStorageAtom);
  const lines = current.lines.filter((line) => line.lineId !== lineId);
  if (lines.length === current.lines.length) return;
  if (lines.length === 0) set(cartStorageAtom, RESET);
  else set(cartStorageAtom, { ...current, lines });
});

export const clearCartAtom = atom<null, [], void>(null, (_get, set) => {
  set(cartStorageAtom, RESET);
});

export type CartTestStoreOptions = Readonly<{
  initialState?: CartState;
  storage?: Storage;
}>;

export function createCartTestStore(options: CartTestStoreOptions = {}) {
  const store = createStore();
  const storage = options.storage ?? createMemoryStringStorage();
  const validatedStorage = createValidatedCartStorage(storage);
  const raw = storage.getItem(CART_STORAGE_KEY);
  const hydrated = validatedStorage.getItem(CART_STORAGE_KEY, EMPTY_CART);
  store.set(cartStorageAtom, options.initialState ?? (raw === null ? EMPTY_CART : hydrated));
  store.sub(cartAtom, () => {
    const cart = store.get(cartAtom);
    if (cart.lines.length === 0) storage.removeItem(CART_STORAGE_KEY);
    else validatedStorage.setItem(CART_STORAGE_KEY, cart);
  });
  return store;
}
