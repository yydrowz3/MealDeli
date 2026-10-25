import { useI18n } from "../../../shared/i18n";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Badge, Button, EmptyState, ErrorState, Skeleton } from "../../../shared/ui";
import type { CatalogRepository } from "../api/catalog-repository";
import { CatalogImage } from "../components/catalog-image";
import { DishCard } from "../components/dish-card";
import { isPromotionActive } from "../model/promotion";
import type { Dish, RestaurantDetail } from "../model/types";

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
  const { t } = useI18n();
  return (
    <main
      aria-label={t("catalog.loadingMenu")}
      className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6"
      role="status"
    >
      <Skeleton className="aspect-video min-h-48! w-full rounded-card! md:aspect-[3/1]" />
      <Skeleton className="h-12 w-[45%]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-72" key={index} />
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
  const { t, text } = useI18n();
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
      <main className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6">
        <Button onClick={onBack} variant="tertiary">
          <ArrowLeftIcon aria-hidden="true" size={18} />
          {t("catalog.back")}
        </Button>
        <div>
          <Skeleton className="aspect-video min-h-48! w-full rounded-card! md:aspect-[3/1]" />
          <ErrorState
            action={{
              label: t("common.tryAgain"),
              onClick: () => setRetryVersion((value) => value + 1),
            }}
            title={t("common.loadRestaurantFailed")}
          />
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6">
        <ErrorState
          action={{ label: t("catalog.back"), onClick: onBack }}
          title={t("catalog.notFound")}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6">
      <Button onClick={onBack} variant="tertiary">
        <ArrowLeftIcon aria-hidden="true" size={18} />
        {t("catalog.back")}
      </Button>
      <CatalogImage
        allowExternalSource
        className="aspect-video min-h-48 w-full rounded-card md:aspect-[3/1]"
        alt={text(restaurant.name)}
        source={restaurant.image}
      />
      <header className="[&_p]:text-muted [&_address]:text-muted [&_address]:not-italic">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-page">{text(restaurant.name)}</h1>
            {isPromotionActive(restaurant.promotedUntil, now) ? (
              <Badge tone="jade">{t("catalog.promoted")}</Badge>
            ) : null}
          </div>
          <p>{text(restaurant.category.name)}</p>
          <address>{text(restaurant.address)}</address>
        </div>
      </header>
      <div
        className={[
          "grid grid-cols-1 items-start gap-6",
          cartSlots?.sidebar ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <section className="min-w-0" aria-labelledby="catalog-menu-title">
          <h2 className="mb-4 text-section" id="catalog-menu-title">
            {t("common.menu")}
          </h2>
          {restaurant.dishes.length === 0 ? (
            <EmptyState title={t("catalog.emptyMenu")} />
          ) : (
            <div
              className={[
                "grid grid-cols-1 gap-4 sm:grid-cols-2",
                cartSlots?.sidebar ? "" : "lg:grid-cols-3",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {restaurant.dishes.map((dish) => (
                <DishCard dish={dish} key={dish.id} onSelect={onSelectDish} />
              ))}
            </div>
          )}
        </section>
        {cartSlots?.sidebar ? (
          <aside className="sticky top-24 hidden lg:block">{text(cartSlots.sidebar)}</aside>
        ) : null}
      </div>
      {cartSlots?.mobileBar ? (
        <div className="sticky bottom-24 z-10 lg:hidden">{text(cartSlots.mobileBar)}</div>
      ) : null}
    </main>
  );
}
