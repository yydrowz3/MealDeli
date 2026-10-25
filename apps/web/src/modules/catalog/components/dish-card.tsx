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
      className="cursor-pointer border-0 border-none bg-none p-0 text-left text-inherit focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:outline-offset-2"
      onClick={() => onSelect(dish)}
      type="button"
    >
      <Card className="grid h-full gap-3 overflow-hidden p-6!">
        <CatalogImage
          allowExternalSource
          alt={text(dish.name)}
          className="aspect-[16/8] w-full"
          source={dish.image}
        />
        <div className="grid gap-2 px-4 pt-0 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3>{text(dish.name)}</h3>
            {dish.options.length > 0 ? <small>{t("catalog.customize")}</small> : null}
          </div>
          <p className="line-clamp-3 text-muted">{text(dish.description)}</p>
          <p className="font-[750]">
            {text(hasExtraCharge ? t("catalog.from") : null)}
            <Money minor={dish.priceMinor} />
          </p>
        </div>
      </Card>
    </button>
  );
}
