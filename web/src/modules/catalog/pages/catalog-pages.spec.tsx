import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { CatalogRepository } from "../api/catalog-repository";
import type { CatalogSearch } from "../model/types";
import {
  buildCategory,
  buildDish,
  buildRestaurant,
  buildRestaurantDetail,
  buildRestaurantPage,
} from "../testing/fixtures";
import { RestaurantDiscoveryPage } from "./restaurant-discovery-page";
import { RestaurantMenuPage } from "./restaurant-menu-page";

function repository(overrides: Partial<CatalogRepository> = {}): CatalogRepository {
  return {
    getCategories: async () => [buildCategory()],
    getRestaurants: async () => buildRestaurantPage(),
    getRestaurant: async () => buildRestaurantDetail(),
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("RestaurantDiscoveryPage", () => {
  it("shows loading and the search-specific empty state", async () => {
    const result = deferred<ReturnType<typeof buildRestaurantPage>>();
    const catalog = repository({ getRestaurants: () => result.promise });
    render(
      <RestaurantDiscoveryPage
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={catalog}
        search={{ query: "ramen", page: 1 }}
      />,
    );
    expect(screen.getByRole("status", { name: "Loading restaurants" })).toBeVisible();
    await act(async () =>
      result.resolve(buildRestaurantPage({ items: [], totalPages: 0, totalResults: 0 })),
    );
    expect(await screen.findByText("No restaurants found")).toBeVisible();
    expect(screen.getByText("Try a different restaurant name.")).toBeVisible();
  });

  it("shows category empty and recoverable error states", async () => {
    const failing = repository({
      getRestaurants: async () => Promise.reject(new Error("offline")),
    });
    const { rerender } = render(
      <RestaurantDiscoveryPage
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={failing}
        search={{ page: 1 }}
      />,
    );
    expect(await screen.findByText("We couldn’t load restaurants.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();

    rerender(
      <RestaurantDiscoveryPage
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={repository({
          getRestaurants: async () =>
            buildRestaurantPage({ items: [], totalPages: 0, totalResults: 0 }),
        })}
        search={{ category: "thai", page: 1 }}
      />,
    );
    expect(await screen.findByText("No restaurants in this category yet.")).toBeVisible();
  });

  it("expires Promotion by the injected clock and never renders unsupported facts", async () => {
    const restaurant = buildRestaurant({
      promotedUntil: "2030-01-02T00:00:00.000Z",
      image: "https://tb-static.uber.com/prod/blocked.jpeg",
    });
    const catalog = repository({
      getRestaurants: async () => buildRestaurantPage({ items: [restaurant] }),
    });
    const { rerender } = render(
      <RestaurantDiscoveryPage
        deliveryAddress="500 Mission Street"
        now={new Date("2030-01-01T00:00:00.000Z")}
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={catalog}
        search={{ page: 1 }}
      />,
    );
    expect(await screen.findByText("Promoted")).toBeVisible();
    expect(screen.getByText("500 Mission Street")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "MealDeli placeholder for Seoul Kitchen" }),
    ).toBeVisible();
    expect(document.querySelector('img[src*="uber.com"]')).toBeNull();
    expect(
      screen.queryByText(/rating|ETA|distance|delivery fee|open now/i),
    ).not.toBeInTheDocument();

    rerender(
      <RestaurantDiscoveryPage
        now={new Date("2030-01-03T00:00:00.000Z")}
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={catalog}
        search={{ page: 1 }}
      />,
    );
    await waitFor(() => expect(screen.queryByText("Promoted")).not.toBeInTheDocument());
  });

  it("keeps URL search as the owner, switches exclusive filters, paginates, and focuses results", async () => {
    const catalog = repository({
      getRestaurants: async (search) =>
        buildRestaurantPage({
          items: [
            buildRestaurant({ id: `restaurant-${search.page}`, name: `Page ${search.page}` }),
          ],
          page: search.page,
          totalPages: 2,
          totalResults: 2,
        }),
    });

    function Harness() {
      const [search, setSearch] = useState<CatalogSearch>({ category: "korean", page: 1 });
      return (
        <RestaurantDiscoveryPage
          onSearchChange={setSearch}
          onViewRestaurant={() => undefined}
          repository={catalog}
          search={search}
        />
      );
    }

    const user = userEvent.setup();
    render(<Harness />);
    expect(await screen.findByText("Page 1")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Page 2")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "All restaurants" })).toHaveFocus(),
    );

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps stale page content while refreshing and offers retry after refresh failure", async () => {
    const refresh = deferred<ReturnType<typeof buildRestaurantPage>>();
    const catalog = repository({
      getRestaurants: (search) =>
        search.page === 1
          ? Promise.resolve(
              buildRestaurantPage({ items: [buildRestaurant({ name: "Cached result" })] }),
            )
          : refresh.promise,
    });
    const { rerender } = render(
      <RestaurantDiscoveryPage
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={catalog}
        search={{ page: 1 }}
      />,
    );
    expect(await screen.findByText("Cached result")).toBeVisible();
    rerender(
      <RestaurantDiscoveryPage
        onSearchChange={() => undefined}
        onViewRestaurant={() => undefined}
        repository={catalog}
        search={{ page: 2 }}
      />,
    );
    expect(screen.getByText("Cached result")).toBeVisible();
    expect(screen.getByText("Refreshing restaurants…")).toHaveAttribute("role", "status");
    await act(async () => refresh.reject(new Error("offline")));
    expect(await screen.findByText("We couldn’t refresh restaurants.")).toBeVisible();
    expect(screen.getByText("Cached result")).toBeVisible();
  });
});

describe("RestaurantMenuPage", () => {
  it("shows loading, not-found, empty, and network error shells", async () => {
    const pending = deferred<ReturnType<typeof buildRestaurantDetail> | null>();
    const { rerender } = render(
      <RestaurantMenuPage
        onBack={() => undefined}
        onSelectDish={() => undefined}
        repository={repository({ getRestaurant: () => pending.promise })}
        restaurantId="restaurant"
      />,
    );
    expect(screen.getByRole("status", { name: "Loading restaurant menu" })).toBeVisible();
    await act(async () => pending.resolve(null));
    expect(await screen.findByText("Restaurant not found")).toBeVisible();

    rerender(
      <RestaurantMenuPage
        onBack={() => undefined}
        onSelectDish={() => undefined}
        repository={repository({
          getRestaurant: async () => buildRestaurantDetail({ dishes: [] }),
        })}
        restaurantId="empty"
      />,
    );
    expect(await screen.findByText("This restaurant hasn’t added a menu yet.")).toBeVisible();

    rerender(
      <RestaurantMenuPage
        onBack={() => undefined}
        onSelectDish={() => undefined}
        repository={repository({ getRestaurant: async () => Promise.reject(new Error("offline")) })}
        restaurantId="error"
      />,
    );
    expect(await screen.findByText("We couldn’t load this restaurant.")).toBeVisible();
  });

  it("uses cents, injected Cart slots, and keyboard Dish activation", async () => {
    const onSelectDish = vi.fn();
    const dish = buildDish({ priceMinor: 1299 });
    const user = userEvent.setup();
    render(
      <RestaurantMenuPage
        cartSlots={{
          sidebar: <div>Cart summary</div>,
          mobileBar: <div>View cart · 1 · $12.99</div>,
        }}
        onBack={() => undefined}
        onSelectDish={onSelectDish}
        repository={repository({
          getRestaurant: async () => buildRestaurantDetail({ dishes: [dish] }),
        })}
        restaurantId="restaurant"
      />,
    );
    const dishButton = await screen.findByRole("button", { name: "Select Bibimbap" });
    expect(
      screen.getByText((_, element) => element?.textContent === "From $12.99"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$12.99").length).toBeGreaterThan(0);
    expect(screen.getByText("Cart summary")).toBeVisible();
    expect(screen.getByText("View cart · 1 · $12.99")).toBeVisible();
    dishButton.focus();
    await user.keyboard("{Enter}");
    expect(onSelectDish).toHaveBeenCalledWith(dish);
  });
});
