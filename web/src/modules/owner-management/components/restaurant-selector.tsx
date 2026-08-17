import { useAtomValue, useSetAtom } from "jotai";

import type { RestaurantSummary } from "../../catalog";
import { Select } from "../../../shared/ui";
import {
  selectedOwnerRestaurantIdAtom,
  setSelectedOwnerRestaurantAtom,
} from "../model/selection-atoms";

export type RestaurantSelectorProps = Readonly<{
  restaurants: readonly RestaurantSummary[];
  onSelect?: (restaurantId: string) => void;
}>;

export function RestaurantSelector({ restaurants, onSelect }: RestaurantSelectorProps) {
  const selectedId = useAtomValue(selectedOwnerRestaurantIdAtom);
  const select = useSetAtom(setSelectedOwnerRestaurantAtom);
  return (
    <Select
      label="Current restaurant"
      onChange={(event) => {
        select(event.target.value);
        onSelect?.(event.target.value);
      }}
      value={selectedId ?? ""}
    >
      {restaurants.length === 0 ? <option value="">No restaurants</option> : null}
      {restaurants.map((restaurant) => (
        <option key={restaurant.id} value={restaurant.id}>
          {restaurant.name}
        </option>
      ))}
    </Select>
  );
}
