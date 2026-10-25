import { useI18n } from "../../../shared/i18n";
import { useEffect, useRef, useState } from "react";

import { Button, EmptyState, ErrorState, Skeleton } from "../../../shared/ui";
import type { CatalogRepository } from "../api/catalog-repository";
import { CatalogSearchForm } from "../components/catalog-search-form";
import { CategoryStrip } from "../components/category-strip";
import { Pagination } from "../components/pagination";
import { RestaurantCard } from "../components/restaurant-card";
import { isPromotionActive } from "../model/promotion";
import {
  selectCatalogCategory,
  selectCatalogPage,
  selectCatalogQuery,
} from "../model/search-params";
import type {
  CatalogPage,
  CatalogSearch,
  CategorySummary,
  RestaurantSummary,
} from "../model/types";

export type RestaurantDiscoveryPageProps = {
  repository: CatalogRepository;
  search: CatalogSearch;
  onSearchChange: (search: CatalogSearch) => void;
  onViewRestaurant: (restaurantId: string) => void;
  deliveryAddress?: string | null;
  onEditAddress?: () => void;
  now?: Date | number;
};

function DiscoverySkeleton() {
  const { t } = useI18n();
  return (
    <div
      aria-label={t("catalog.loadingRestaurants")}
      className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6"
      role="status"
    >
      <Skeleton className="h-control-md" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-32 w-36 shrink-0" key={index} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-80" key={index} />
        ))}
      </div>
    </div>
  );
}

function RestaurantGrid({
  restaurants,
  onViewRestaurant,
  now,
}: {
  restaurants: readonly RestaurantSummary[];
  onViewRestaurant: (restaurantId: string) => void;
  now?: Date | number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          now={now}
          onViewMenu={onViewRestaurant}
          restaurant={restaurant}
        />
      ))}
    </div>
  );
}

export function RestaurantDiscoveryPage({
  repository,
  search,
  onSearchChange,
  onViewRestaurant,
  deliveryAddress,
  onEditAddress,
  now = Date.now(),
}: RestaurantDiscoveryPageProps) {
  const { t, text } = useI18n();
  const [categories, setCategories] = useState<readonly CategorySummary[]>([]);
  const [pageData, setPageData] = useState<CatalogPage<RestaurantSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const lastLoadedPageRef = useRef<number | null>(null);
  const hasPageDataRef = useRef(false);
  const activeQuery = search.query;
  const activeCategory = search.category;
  const activePage = search.page;

  useEffect(() => {
    let current = true;
    void repository
      .getCategories()
      .then((items) => {
        if (current) setCategories(items);
      })
      .catch(() => {
        if (current) setCategories([]);
      });
    return () => {
      current = false;
    };
  }, [repository, retryVersion]);

  useEffect(() => {
    let current = true;
    if (hasPageDataRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);

    void repository
      .getRestaurants({
        ...(activeQuery ? { query: activeQuery } : {}),
        ...(activeCategory ? { category: activeCategory } : {}),
        page: activePage,
      })
      .then((result) => {
        if (!current) return;
        hasPageDataRef.current = true;
        setPageData(result);
        setLoading(false);
        setRefreshing(false);
        if (lastLoadedPageRef.current !== null && lastLoadedPageRef.current !== result.page) {
          requestAnimationFrame(() => resultTitleRef.current?.focus());
        }
        lastLoadedPageRef.current = result.page;
      })
      .catch((cause: unknown) => {
        if (!current) return;
        setError(cause instanceof Error ? cause : new Error("Catalog request failed."));
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      current = false;
    };
  }, [repository, activeCategory, activePage, activeQuery, retryVersion]);

  if (loading && !pageData) return <DiscoverySkeleton />;

  const restaurants = pageData?.items ?? [];
  const promoted =
    search.page === 1 && !search.query && !search.category
      ? restaurants.filter((restaurant) => isPromotionActive(restaurant.promotedUntil, now))
      : [];
  const promotedIds = new Set(promoted.map((restaurant) => restaurant.id));
  const remaining = restaurants.filter((restaurant) => !promotedIds.has(restaurant.id));
  const emptyTitle = search.query
    ? t("catalog.noSearchResults")
    : search.category
      ? t("catalog.emptyCategory")
      : t("catalog.empty");
  const emptyDescription = search.query ? t("catalog.searchHint") : undefined;

  return (
    <main className="mx-auto grid min-w-0 max-w-content grid-cols-1 gap-8 p-4 md:p-6">
      <header className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
        <div>
          <p className="text-small font-bold text-jade-text">MealDeli</p>
          <h1 className="text-page">{t("common.restaurants")}</h1>
        </div>
        <CatalogSearchForm
          onSearch={(query) => onSearchChange(selectCatalogQuery(query))}
          query={search.query}
        />
      </header>

      <section
        aria-label={t("common.deliveryAddress")}
        className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-jade-soft p-4 [&_p]:text-muted"
      >
        <div>
          <strong>
            {text(deliveryAddress ? t("catalog.deliveryTo") : t("catalog.addDeliveryAddress"))}
          </strong>
          {deliveryAddress ? <p>{text(deliveryAddress)}</p> : <p>{t("catalog.addressHelp")}</p>}
        </div>
        {onEditAddress ? (
          <Button onClick={onEditAddress} variant="tertiary">
            {text(deliveryAddress ? t("common.edit") : t("catalog.addAddress"))}
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="catalog-categories-title">
        <h2 className="mb-4 text-section" id="catalog-categories-title">
          {t("common.categories")}
        </h2>
        <CategoryStrip
          categories={categories}
          onSelect={(slug) => onSearchChange(selectCatalogCategory(slug))}
          selected={search.category}
        />
      </section>

      {error && !pageData ? (
        <ErrorState
          action={{
            label: t("common.tryAgain"),
            onClick: () => setRetryVersion((value) => value + 1),
          }}
          description={t("common.connectionRetry")}
          title={t("catalog.loadFailed")}
        />
      ) : (
        <section aria-busy={refreshing} aria-labelledby="catalog-results-title">
          <div className="flex items-baseline justify-between gap-3 [&_span]:text-small [&_span]:text-muted">
            <h2
              className="mb-4 text-section"
              id="catalog-results-title"
              ref={resultTitleRef}
              tabIndex={-1}
            >
              {text(
                search.query
                  ? t("catalog.searchResults", { query: search.query })
                  : t("common.allRestaurants"),
              )}
            </h2>
            {refreshing ? <span role="status">{t("catalog.refreshing")}</span> : null}
          </div>
          {error ? (
            <div
              className="mb-4 flex items-center justify-between rounded-control bg-danger-soft p-3"
              role="alert"
            >
              <span>{t("catalog.refreshFailed")}</span>
              <Button onClick={() => setRetryVersion((value) => value + 1)} variant="tertiary">
                {t("common.tryAgain")}
              </Button>
            </div>
          ) : null}
          {restaurants.length === 0 ? (
            <EmptyState description={text(emptyDescription)} title={text(emptyTitle)} />
          ) : (
            <>
              {promoted.length > 0 ? (
                <section aria-labelledby="catalog-promoted-title">
                  <h3 className="mb-3 text-section" id="catalog-promoted-title">
                    {t("catalog.promotedOn")}
                  </h3>
                  <RestaurantGrid
                    now={now}
                    onViewRestaurant={onViewRestaurant}
                    restaurants={promoted}
                  />
                </section>
              ) : null}
              {remaining.length > 0 ? (
                <RestaurantGrid
                  now={now}
                  onViewRestaurant={onViewRestaurant}
                  restaurants={remaining}
                />
              ) : null}
              <Pagination
                onPageChange={(page) => onSearchChange(selectCatalogPage(search, page))}
                page={pageData?.page ?? search.page}
                totalPages={pageData?.totalPages ?? 0}
              />
            </>
          )}
        </section>
      )}
    </main>
  );
}
