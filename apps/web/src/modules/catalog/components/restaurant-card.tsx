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
  return (
    <Card className="grid gap-3 overflow-hidden p-6!">
      <CatalogImage
        allowExternalSource
        alt={restaurant.name}
        className="aspect-video w-full max-h-48 overflow-hidden"
        source={restaurant.image}
      />
      <div className="grid gap-2 px-4 pt-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h3>{restaurant.name}</h3>
          {isPromotionActive(restaurant.promotedUntil, now) ? (
            <Badge tone="jade">Promoted</Badge>
          ) : null}
        </div>
        <p className="text-[length:var(--font-size-small)] font-[650] text-jade-text">
          {restaurant.category.name}
        </p>
        <p className="line-clamp-2 text-muted">{restaurant.address}</p>
        <Button onClick={() => onViewMenu(restaurant.id)} variant="secondary">
          View menu
        </Button>
      </div>
    </Card>
  );
}
