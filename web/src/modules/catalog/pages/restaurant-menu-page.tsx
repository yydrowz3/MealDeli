import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Badge, Button, EmptyState, ErrorState, Skeleton } from "../../../shared/ui";
import type { CatalogRepository } from "../api/catalog-repository";
import { CatalogImage } from "../components/catalog-image";
import { DishCard } from "../components/dish-card";
import { isPromotionActive } from "../model/promotion";
import type { Dish, RestaurantDetail } from "../model/types";

import "../catalog.css";

export type CatalogCartSlots = Readonly<{
  sidebar?: ReactNode;
  mobileBar?: ReactNode;
}>;

export type RestaurantMenuPageProps = {
  repository: CatalogRepository;
  restaurantId: string;
  onSelectDish: (dish: Dish) => void;
  onBack: () => void;
  cartSlots?: CatalogCartSlots;
  now?: Date | number;
};

function MenuSkeleton() {
  return (
    <main aria-label="Loading restaurant menu" className="catalog-page" role="status">
      <Skeleton className="catalog-menu-hero" />
      <Skeleton className="catalog-skeleton-title" />
      <div className="catalog-dish-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="catalog-skeleton-dish" key={index} />
        ))}
      </div>
    </main>
  );
}

export function RestaurantMenuPage({
  repository,
  restaurantId,
  onSelectDish,
  onBack,
  cartSlots,
  now = Date.now(),
}: RestaurantMenuPageProps) {
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let current = true;
    setError(null);
    void repository
      .getRestaurant(restaurantId)
      .then((result) => {
        if (current) setRestaurant(result);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(cause instanceof Error ? cause : new Error("Catalog request failed."));
      });
    return () => {
      current = false;
    };
  }, [repository, restaurantId, retryVersion]);

  if (restaurant === undefined && !error) return <MenuSkeleton />;

  if (error) {
    return (
      <main className="catalog-page">
        <Button onClick={onBack} variant="tertiary">
          Back to restaurants
        </Button>
        <div className="catalog-error-shell">
          <Skeleton className="catalog-menu-hero" />
          <ErrorState
            action={{ label: "Try again", onClick: () => setRetryVersion((value) => value + 1) }}
            title="We couldn’t load this restaurant."
          />
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="catalog-page">
        <ErrorState
          action={{ label: "Back to restaurants", onClick: onBack }}
          title="Restaurant not found"
        />
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <Button onClick={onBack} variant="tertiary">
        Back to restaurants
      </Button>
      <CatalogImage className="catalog-menu-hero" alt={restaurant.name} source={restaurant.image} />
      <header className="catalog-menu-header">
        <div>
          <div className="catalog-card__title-row">
            <h1>{restaurant.name}</h1>
            {isPromotionActive(restaurant.promotedUntil, now) ? (
              <Badge tone="jade">Promoted</Badge>
            ) : null}
          </div>
          <p>{restaurant.category.name}</p>
          <address>{restaurant.address}</address>
        </div>
      </header>
      <div className="catalog-menu-layout">
        <section aria-labelledby="catalog-menu-title">
          <h2 id="catalog-menu-title">Menu</h2>
          {restaurant.dishes.length === 0 ? (
            <EmptyState title="This restaurant hasn’t added a menu yet." />
          ) : (
            <div className="catalog-dish-grid">
              {restaurant.dishes.map((dish) => (
                <DishCard dish={dish} key={dish.id} onSelect={onSelectDish} />
              ))}
            </div>
          )}
        </section>
        {cartSlots?.sidebar ? (
          <aside className="catalog-cart-sidebar">{cartSlots.sidebar}</aside>
        ) : null}
      </div>
      {cartSlots?.mobileBar ? (
        <div className="catalog-cart-mobile">{cartSlots.mobileBar}</div>
      ) : null}
    </main>
  );
}
