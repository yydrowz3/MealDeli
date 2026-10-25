import { useI18n } from "../../../shared/i18n";
import { Card, Money } from "../../../shared/ui";
import type { Dish } from "../model/types";
import { CatalogImage } from "./catalog-image";

export type DishCardProps = {
  dish: Dish;
  onSelect: (dish: Dish) => void;
};

export function DishCard({ dish, onSelect }: DishCardProps) {
  const { t, text } = useI18n();
  const hasExtraCharge = dish.options.some((option) =>
    option.choices.some((choice) => choice.extraMinor > 0),
  );

  return (
    <button
      aria-label={t("catalog.selectDish", { name: dish.name })}
      className="cursor-pointer border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2"
      onClick={() => onSelect(dish)}
      type="button"
    >
      <Card className="grid h-full content-start gap-3 overflow-hidden">
        <CatalogImage
          allowExternalSource
          alt={text(dish.name)}
          className="aspect-video w-full"
          source={dish.image}
        />
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-body font-semibold">{text(dish.name)}</h3>
            {dish.options.length > 0 ? <small>{t("catalog.customize")}</small> : null}
          </div>
          <p className="line-clamp-3 text-muted">{text(dish.description)}</p>
          <p className="font-bold">
            {text(hasExtraCharge ? t("catalog.from") : null)}
            <Money minor={dish.priceMinor} />
          </p>
        </div>
      </Card>
    </button>
  );
}
