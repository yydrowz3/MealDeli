import { describe, expect, it } from "vitest";

import {
  clearOwnerRestaurantSelectionAtom,
  createOwnerSelectionTestStore,
  reconcileOwnerRestaurantSelectionAtom,
  resolveOwnerRestaurantSelection,
  selectedOwnerRestaurantIdAtom,
  selectAfterOwnerRestaurantDeleteAtom,
  setSelectedOwnerRestaurantAtom,
} from "./selection-atoms";

const FIRST = "11111111-1111-4111-8111-111111111111";
const SECOND = "22222222-2222-4222-8222-222222222222";

describe("owner restaurant selection", () => {
  it("prefers an owned URL id, then valid storage, then the first restaurant", () => {
    expect(resolveOwnerRestaurantSelection(SECOND, FIRST, [FIRST, SECOND])).toEqual({
      selectedRestaurantId: SECOND,
      urlRestaurantMissing: false,
    });
    expect(
      resolveOwnerRestaurantSelection(null, SECOND, [FIRST, SECOND]).selectedRestaurantId,
    ).toBe(SECOND);
    expect(
      resolveOwnerRestaurantSelection(null, "deleted", [FIRST, SECOND]).selectedRestaurantId,
    ).toBe(FIRST);
    expect(resolveOwnerRestaurantSelection(null, FIRST, []).selectedRestaurantId).toBeNull();
  });

  it("clears an inaccessible URL restaurant instead of falling back silently", () => {
    expect(resolveOwnerRestaurantSelection("not-owned", FIRST, [FIRST])).toEqual({
      selectedRestaurantId: null,
      urlRestaurantMissing: true,
    });
  });

  it("reconciles deleted restaurants and selects the next restaurant after deletion", () => {
    const store = createOwnerSelectionTestStore({ selectedRestaurantId: SECOND });
    store.set(reconcileOwnerRestaurantSelectionAtom, { restaurantIds: [FIRST] });
    expect(store.get(selectedOwnerRestaurantIdAtom)).toBe(FIRST);
    store.set(selectAfterOwnerRestaurantDeleteAtom, {
      deletedRestaurantId: FIRST,
      remainingRestaurantIds: [],
    });
    expect(store.get(selectedOwnerRestaurantIdAtom)).toBeNull();
  });

  it("clears selection on logout and keeps stores isolated", () => {
    const firstStore = createOwnerSelectionTestStore();
    const secondStore = createOwnerSelectionTestStore();
    firstStore.set(setSelectedOwnerRestaurantAtom, FIRST);
    secondStore.set(setSelectedOwnerRestaurantAtom, SECOND);
    expect(firstStore.get(selectedOwnerRestaurantIdAtom)).toBe(FIRST);
    expect(secondStore.get(selectedOwnerRestaurantIdAtom)).toBe(SECOND);
    firstStore.set(clearOwnerRestaurantSelectionAtom);
    expect(firstStore.get(selectedOwnerRestaurantIdAtom)).toBeNull();
    expect(secondStore.get(selectedOwnerRestaurantIdAtom)).toBe(SECOND);
  });
});
