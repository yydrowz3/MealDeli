import { Provider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { buildCategory } from "../../catalog";
import type { OwnerRestaurantRepository } from "../model/types";
import { createOwnerSelectionTestStore } from "../model/selection-atoms";
import { buildOwnerOrder, buildOwnerRestaurant } from "../testing/fixtures";
import { OwnerCreateRestaurantPage } from "./create-restaurant-page";
import { OwnerMenuPage } from "./menu-page";
import { OwnerRestaurantOverviewPage } from "./restaurant-overview-page";
import { OwnerRestaurantSettingsPage } from "./settings-page";

function repository(overrides: Partial<OwnerRestaurantRepository> = {}): OwnerRestaurantRepository {
  const restaurant = buildOwnerRestaurant();
  return {
    list: vi.fn(async () => [restaurant]),
    get: vi.fn(async () => restaurant),
    create: vi.fn(async () => ({ ok: true as const, value: restaurant })),
    update: vi.fn(async () => ({ ok: true as const, value: restaurant })),
    delete: vi.fn(async () => ({ ok: true as const, value: undefined })),
    createDish: vi.fn(async () => ({ ok: true as const, value: restaurant })),
    updateDish: vi.fn(async () => ({ ok: true as const, value: restaurant })),
    deleteDish: vi.fn(async () => ({ ok: true as const, value: restaurant })),
    ...overrides,
  };
}

function ownerRender(node: React.ReactNode) {
  return render(<Provider store={createOwnerSelectionTestStore()}>{node}</Provider>);
}

describe("Owner page integration", () => {
  it("loads categories for restaurant creation and recovers from a category error", async () => {
    const catalogRepository = { getCategories: vi.fn().mockResolvedValue([buildCategory()]) };
    const first = ownerRender(
      <OwnerCreateRestaurantPage
        catalogRepository={catalogRepository}
        navigate={vi.fn()}
        repository={repository()}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Create restaurant" })).toBeInTheDocument();
    first.unmount();

    catalogRepository.getCategories.mockRejectedValueOnce(new Error("offline"));
    ownerRender(
      <OwnerCreateRestaurantPage
        catalogRepository={catalogRepository}
        navigate={vi.fn()}
        repository={repository()}
      />,
    );
    expect(await screen.findByText("We couldn’t load categories.")).toBeInTheDocument();
  });

  it("shows the restaurant overview with live order totals and navigation", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    ownerRender(
      <OwnerRestaurantOverviewPage
        navigate={navigate}
        orderRepository={{ list: vi.fn(async () => [buildOwnerOrder()]) }}
        repository={repository()}
        restaurantId={buildOwnerRestaurant().id}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: buildOwnerRestaurant().name }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Manage menu" }));
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/menu"));
    expect(screen.getAllByText("$12.99")).toHaveLength(2);
  });

  it("handles missing and failed restaurant overview loads", async () => {
    const missing = repository({ get: vi.fn(async () => null) });
    const first = ownerRender(
      <OwnerRestaurantOverviewPage
        navigate={vi.fn()}
        orderRepository={{ list: vi.fn(async () => []) }}
        repository={missing}
        restaurantId="missing"
      />,
    );
    expect(await screen.findByText("Restaurant not found.")).toBeInTheDocument();
    first.unmount();

    ownerRender(
      <OwnerRestaurantOverviewPage
        navigate={vi.fn()}
        orderRepository={{
          list: vi.fn(async () => {
            throw new Error("offline");
          }),
        }}
        repository={repository()}
        restaurantId="broken"
      />,
    );
    expect(await screen.findByText("We couldn’t load this restaurant.")).toBeInTheDocument();
  });

  it("opens the dish editor and deletes a confirmed dish", async () => {
    const user = userEvent.setup();
    const repo = repository();
    ownerRender(<OwnerMenuPage repository={repo} restaurantId={buildOwnerRestaurant().id} />);
    expect(await screen.findByRole("heading", { name: "Menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add dish" }));
    expect(screen.getByRole("heading", { name: "Add dish" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete dish" }));
    await waitFor(() => expect(repo.deleteDish).toHaveBeenCalled());
  });

  it("loads settings and safely deletes the restaurant", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const repo = repository({ list: vi.fn(async () => []) });
    ownerRender(
      <OwnerRestaurantSettingsPage
        navigate={navigate}
        repository={repo}
        restaurantId={buildOwnerRestaurant().id}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Restaurant settings" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete restaurant" }));
    const buttons = screen.getAllByRole("button", { name: "Delete restaurant" });
    await user.click(buttons.at(-1)!);
    await waitFor(() => expect(repo.delete).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/restaurants");
  });

  it("renders missing settings and menu failures without private data", async () => {
    const first = ownerRender(
      <OwnerRestaurantSettingsPage
        navigate={vi.fn()}
        repository={repository({ get: vi.fn(async () => null) })}
        restaurantId="missing"
      />,
    );
    expect(await screen.findByText("Restaurant not found.")).toBeInTheDocument();
    first.unmount();

    ownerRender(
      <OwnerMenuPage
        repository={repository({
          get: vi.fn(async () => {
            throw new Error("offline");
          }),
        })}
        restaurantId="broken"
      />,
    );
    expect(await screen.findByText("We couldn’t load this menu.")).toBeInTheDocument();
  });
});
