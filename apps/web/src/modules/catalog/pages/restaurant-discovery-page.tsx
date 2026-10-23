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

import "../catalog.css";

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
  return (
    <div aria-label="Loading restaurants" className="catalog-page" role="status">
      <Skeleton className="catalog-skeleton-search" />
      <div className="catalog-skeleton-categories">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="catalog-skeleton-category" key={index} />
        ))}
      </div>
      <div className="catalog-restaurant-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="catalog-skeleton-card" key={index} />
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
    <div className="catalog-restaurant-grid">
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
    ? "No restaurants found"
    : search.category
      ? "No restaurants in this category yet."
      : "No restaurants yet";
  const emptyDescription = search.query ? "Try a different restaurant name." : undefined;

  return (
    <main className="catalog-page">
      <header className="catalog-page__header">
        <div>
          <p className="catalog-eyebrow">MealDeli</p>
          <h1>Restaurants</h1>
        </div>
        <CatalogSearchForm
          onSearch={(query) => onSearchChange(selectCatalogQuery(query))}
          query={search.query}
        />
      </header>

      <section aria-label="Delivery address" className="catalog-address">
        <div>
          <strong>{deliveryAddress ? "Delivery to" : "Add a delivery address"}</strong>
          {deliveryAddress ? (
            <p>{deliveryAddress}</p>
          ) : (
            <p>You can add one now or keep browsing.</p>
          )}
        </div>
        {onEditAddress ? (
          <Button onClick={onEditAddress} variant="tertiary">
            {deliveryAddress ? "Edit" : "Add address"}
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="catalog-categories-title">
        <h2 id="catalog-categories-title">Categories</h2>
        <CategoryStrip
          categories={categories}
          onSelect={(slug) => onSearchChange(selectCatalogCategory(slug))}
          selected={search.category}
        />
      </section>

      {error && !pageData ? (
        <ErrorState
          action={{ label: "Try again", onClick: () => setRetryVersion((value) => value + 1) }}
          description="Check your connection and try again."
          title="We couldn’t load restaurants."
        />
      ) : (
        <section aria-busy={refreshing} aria-labelledby="catalog-results-title">
          <div className="catalog-results-heading">
            <h2 id="catalog-results-title" ref={resultTitleRef} tabIndex={-1}>
              {search.query ? `Results for “${search.query}”` : "All restaurants"}
            </h2>
            {refreshing ? <span role="status">Refreshing restaurants…</span> : null}
          </div>
          {error ? (
            <div className="catalog-inline-error" role="alert">
              <span>We couldn’t refresh restaurants.</span>
              <Button onClick={() => setRetryVersion((value) => value + 1)} variant="tertiary">
                Try again
              </Button>
            </div>
          ) : null}
          {restaurants.length === 0 ? (
            <EmptyState description={emptyDescription} title={emptyTitle} />
          ) : (
            <>
              {promoted.length > 0 ? (
                <section aria-labelledby="catalog-promoted-title">
                  <h3 id="catalog-promoted-title">Promoted on MealDeli</h3>
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
