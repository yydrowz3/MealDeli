import { useI18n } from "../../../shared/i18n";
import { Badge, Button, Card } from "../../../shared/ui";
import type { RestaurantSummary } from "../model/types";
import { isPromotionActive } from "../model/promotion";
import { CatalogImage } from "./catalog-image";

export type RestaurantCardProps = {
  restaurant: RestaurantSummary;
  onViewMenu: (restaurantId: string) => void;
  now?: Date | number;
};

export function RestaurantCard({ restaurant, onViewMenu, now }: RestaurantCardProps) {
  const { t, text } = useI18n();
  return (
    <Card className="grid gap-3 overflow-hidden">
      <CatalogImage
        allowExternalSource
        alt={text(restaurant.name)}
        className="aspect-video w-full max-h-48 overflow-hidden"
        source={restaurant.image}
      />
      <div className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-body font-semibold">{text(restaurant.name)}</h3>
          {isPromotionActive(restaurant.promotedUntil, now) ? (
            <Badge tone="jade">{t("catalog.promoted")}</Badge>
          ) : null}
        </div>
        <p className="text-small font-semibold text-jade-text">{text(restaurant.category.name)}</p>
        <p className="line-clamp-2 text-muted">{text(restaurant.address)}</p>
        <Button onClick={() => onViewMenu(restaurant.id)} variant="secondary">
          {t("catalog.viewMenu")}
        </Button>
      </div>
    </Card>
  );
}
