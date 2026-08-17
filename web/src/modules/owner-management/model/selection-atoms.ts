import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { createStore } from "jotai/vanilla";

export const OWNER_RESTAURANT_STORAGE_KEY = "mealdeli.owner.restaurant.v1";

const browserStorage = createJSONStorage<string | null>(() => globalThis.localStorage);
const storedOwnerRestaurantIdAtom = atomWithStorage<string | null>(
  OWNER_RESTAURANT_STORAGE_KEY,
  null,
  browserStorage,
  { getOnInit: true },
);

export const selectedOwnerRestaurantIdAtom = atom((get) => get(storedOwnerRestaurantIdAtom));

export const setSelectedOwnerRestaurantAtom = atom(
  null,
  (_get, set, restaurantId: string | null) => {
    set(storedOwnerRestaurantIdAtom, restaurantId);
  },
);

export const clearOwnerRestaurantSelectionAtom = atom(null, (_get, set) => {
  set(storedOwnerRestaurantIdAtom, null);
});

export type SelectionResolution = Readonly<{
  selectedRestaurantId: string | null;
  urlRestaurantMissing: boolean;
}>;

export function resolveOwnerRestaurantSelection(
  urlRestaurantId: string | null | undefined,
  storedRestaurantId: string | null,
  restaurantIds: readonly string[],
): SelectionResolution {
  const owned = new Set(restaurantIds);
  if (urlRestaurantId) {
    return owned.has(urlRestaurantId)
      ? { selectedRestaurantId: urlRestaurantId, urlRestaurantMissing: false }
      : { selectedRestaurantId: null, urlRestaurantMissing: true };
  }
  if (storedRestaurantId && owned.has(storedRestaurantId)) {
    return { selectedRestaurantId: storedRestaurantId, urlRestaurantMissing: false };
  }
  return {
    selectedRestaurantId: restaurantIds[0] ?? null,
    urlRestaurantMissing: false,
  };
}

export const reconcileOwnerRestaurantSelectionAtom = atom(
  null,
  (
    get,
    set,
    input: Readonly<{
      restaurantIds: readonly string[];
      urlRestaurantId?: string | null;
    }>,
  ) => {
    const resolution = resolveOwnerRestaurantSelection(
      input.urlRestaurantId,
      get(storedOwnerRestaurantIdAtom),
      input.restaurantIds,
    );
    set(storedOwnerRestaurantIdAtom, resolution.selectedRestaurantId);
    return resolution;
  },
);

export const selectAfterOwnerRestaurantDeleteAtom = atom(
  null,
  (
    get,
    set,
    input: Readonly<{
      deletedRestaurantId: string;
      remainingRestaurantIds: readonly string[];
    }>,
  ) => {
    if (get(storedOwnerRestaurantIdAtom) !== input.deletedRestaurantId) return;
    set(storedOwnerRestaurantIdAtom, input.remainingRestaurantIds[0] ?? null);
  },
);

export type JotaiStore = ReturnType<typeof createStore>;
export type SelectionTestStoreOptions = Readonly<{
  selectedRestaurantId?: string | null;
}>;

export function createOwnerSelectionTestStore(options: SelectionTestStoreOptions = {}): JotaiStore {
  const store = createStore();
  store.set(setSelectedOwnerRestaurantAtom, options.selectedRestaurantId ?? null);
  return store;
}
