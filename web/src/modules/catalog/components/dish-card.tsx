import { Card, Money } from "../../../shared/ui";
import type { Dish } from "../model/types";
import { CatalogImage } from "./catalog-image";

export type DishCardProps = {
  dish: Dish;
  onSelect: (dish: Dish) => void;
};

export function DishCard({ dish, onSelect }: DishCardProps) {
  const hasExtraCharge = dish.options.some((option) =>
    option.choices.some((choice) => choice.extraMinor > 0),
  );

  return (
    <button
      aria-label={`Select ${dish.name}`}
      className="catalog-dish-button"
      onClick={() => onSelect(dish)}
      type="button"
    >
      <Card className="catalog-dish-card">
        <CatalogImage alt={dish.name} source={dish.image} />
        <div className="catalog-card__body">
          <div className="catalog-card__title-row">
            <h3>{dish.name}</h3>
            {dish.options.length > 0 ? <small>Customize</small> : null}
          </div>
          <p className="catalog-dish-card__description">{dish.description}</p>
          <p className="catalog-dish-card__price">
            {hasExtraCharge ? "From " : null}
            <Money minor={dish.priceMinor} />
          </p>
        </div>
      </Card>
    </button>
  );
}
