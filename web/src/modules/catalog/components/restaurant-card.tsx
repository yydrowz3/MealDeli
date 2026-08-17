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
    <Card className="catalog-restaurant-card">
      <CatalogImage alt={restaurant.name} source={restaurant.image} />
      <div className="catalog-card__body">
        <div className="catalog-card__title-row">
          <h3>{restaurant.name}</h3>
          {isPromotionActive(restaurant.promotedUntil, now) ? (
            <Badge tone="jade">Promoted</Badge>
          ) : null}
        </div>
        <p className="catalog-card__category">{restaurant.category.name}</p>
        <p className="catalog-card__address">{restaurant.address}</p>
        <Button onClick={() => onViewMenu(restaurant.id)} variant="secondary">
          View menu
        </Button>
      </div>
    </Card>
  );
}
