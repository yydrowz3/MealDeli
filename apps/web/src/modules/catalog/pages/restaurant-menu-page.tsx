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
      className="mx-auto grid max-w-content gap-8 p-6 font-sans text-charcoal [@media(max-width:39.99rem)]:p-4 [&_h1]:my-0 [&_h1]:text-page [&_h2]:mt-0 [&_h2]:mb-4 [&_h2]:text-section [&_h3]:my-0 [&_h3]:text-[1.05rem] [&_p]:my-0 [&_[data-state]_h2]:mb-0!"
      role="status"
    >
      <Skeleton className="aspect-[3/1] w-full min-h-48! rounded-card! [@media(max-width:39.99rem)]:aspect-video" />
      <Skeleton className="h-12 w-[45%]" />
      <div className="grid grid-cols-3 gap-4 [@media(max-width:39.99rem)]:grid-cols-1">
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
      <main className="mx-auto grid max-w-content gap-8 p-6 font-sans text-charcoal [@media(max-width:39.99rem)]:p-4 [&_h1]:my-0 [&_h1]:text-page [&_h2]:mt-0 [&_h2]:mb-4 [&_h2]:text-section [&_h3]:my-0 [&_h3]:text-[1.05rem] [&_p]:my-0 [&_[data-state]_h2]:mb-0!">
        <Button
          className="[&>span]:inline-flex [&>span]:items-center [&>span]:flex-row [&>span]:gap-2"
          onClick={onBack}
          variant="tertiary"
        >
          <ArrowLeftIcon aria-hidden="true" size={18} />
          {t("catalog.back")}
        </Button>
        <div>
          <Skeleton className="aspect-[3/1] w-full min-h-48! rounded-card! [@media(max-width:39.99rem)]:aspect-video" />
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
      <main className="mx-auto grid max-w-content gap-8 p-6 font-sans text-charcoal [@media(max-width:39.99rem)]:p-4 [&_h1]:my-0 [&_h1]:text-page [&_h2]:mt-0 [&_h2]:mb-4 [&_h2]:text-section [&_h3]:my-0 [&_h3]:text-[1.05rem] [&_p]:my-0 [&_[data-state]_h2]:mb-0!">
        <ErrorState
          action={{ label: t("catalog.back"), onClick: onBack }}
          title={t("catalog.notFound")}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-content gap-8 p-6 font-sans text-charcoal [@media(max-width:39.99rem)]:p-4 [&_h1]:my-0 [&_h1]:text-page [&_h2]:mt-0 [&_h2]:mb-4 [&_h2]:text-section [&_h3]:my-0 [&_h3]:text-[1.05rem] [&_p]:my-0 [&_[data-state]_h2]:mb-0!">
      <Button
        className="[&>span]:inline-flex [&>span]:items-center [&>span]:flex-row [&>span]:gap-2"
        onClick={onBack}
        variant="tertiary"
      >
        <ArrowLeftIcon aria-hidden="true" size={18} />
        {t("catalog.back")}
      </Button>
      <CatalogImage
        allowExternalSource
        className="aspect-[3/1] w-full min-h-48 rounded-card [@media(max-width:39.99rem)]:aspect-video"
        alt={text(restaurant.name)}
        source={restaurant.image}
      />
      <header className="[&_p]:text-muted [&_address]:text-muted [&_address]:not-italic">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h1>{text(restaurant.name)}</h1>
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
          "grid [align-items:start] gap-6 [@media(max-width:63.99rem)]:grid-cols-1",
          cartSlots?.sidebar
            ? "grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)]"
            : "grid-cols-[minmax(0,1fr)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <section aria-labelledby="catalog-menu-title">
          <h2 id="catalog-menu-title">{t("common.menu")}</h2>
          {restaurant.dishes.length === 0 ? (
            <EmptyState title={t("catalog.emptyMenu")} />
          ) : (
            <div className="grid grid-cols-3 gap-4 [@media(max-width:39.99rem)]:grid-cols-1">
              {restaurant.dishes.map((dish) => (
                <DishCard dish={dish} key={dish.id} onSelect={onSelectDish} />
              ))}
            </div>
          )}
        </section>
        {cartSlots?.sidebar ? (
          <aside className="sticky top-4 [@media(max-width:63.99rem)]:hidden">
            {text(cartSlots.sidebar)}
          </aside>
        ) : null}
      </div>
      {cartSlots?.mobileBar ? (
        <div className="hidden [@media(max-width:63.99rem)]:sticky [@media(max-width:63.99rem)]:bottom-0 [@media(max-width:63.99rem)]:z-10 [@media(max-width:63.99rem)]:block">
          {text(cartSlots.mobileBar)}
        </div>
      ) : null}
    </main>
  );
}
