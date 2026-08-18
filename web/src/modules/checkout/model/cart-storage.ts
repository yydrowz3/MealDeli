import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

import { cartStateSchema, EMPTY_CART } from "./cart-schema";
import type { CartState } from "./types";

export type StringStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createMemoryStringStorage(initial: Readonly<Record<string, string>> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

export function createValidatedCartStorage(storage: StringStorage): SyncStorage<CartState> {
  return {
    getItem(key, initialValue) {
      const raw = storage.getItem(key);
      if (raw === null) return initialValue;
      try {
        const parsed = cartStateSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      } catch {
        // Invalid external input is cleared below.
      }
      storage.removeItem(key);
      return EMPTY_CART;
    },
    setItem(key, value) {
      const parsed = cartStateSchema.parse(value);
      storage.setItem(key, JSON.stringify(parsed));
    },
    removeItem(key) {
      storage.removeItem(key);
    },
  };
}
