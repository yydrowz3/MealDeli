import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";

import { buildCategory } from "../../catalog";
import type { OwnerRestaurantRepository } from "../model/types";
import { createOwnerSelectionTestStore } from "../model/selection-atoms";
import { OwnerRestaurantsPage } from "../pages/restaurants-page";
import { buildOwnerOrder, buildOwnerRestaurant } from "../testing/fixtures";
import { RestaurantForm } from "./restaurant-form";
import { RestaurantSettingsForm } from "./restaurant-settings-form";
import { DishForm } from "./dish-form";
import { OwnerOrdersAction } from "./owner-orders-action";
import { RestaurantSelector } from "./restaurant-selector";

function createRepository(
  overrides: Partial<OwnerRestaurantRepository> = {},
): OwnerRestaurantRepository {
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

describe("RestaurantForm", () => {
  it("validates fields and prevents duplicate create submissions", async () => {
    const user = userEvent.setup();
    const restaurant = buildOwnerRestaurant();
    const categoryId = "55555555-5555-4555-8555-555555555555";
    let finish: ((value: { ok: true; value: typeof restaurant }) => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<{ ok: true; value: typeof restaurant }>((resolve) => {
          finish = resolve;
        }),
    );
    render(<RestaurantForm categories={[buildCategory({ id: categoryId })]} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create restaurant" }));
    expect(await screen.findByText("Restaurant name is required.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Restaurant name"), "  Noodle House  ");
    await user.selectOptions(screen.getByLabelText("Category"), categoryId);
    await user.type(screen.getByLabelText("Address"), "  1 Main Street  ");
    const submit = screen.getByRole("button", { name: "Create restaurant" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Noodle House", address: "1 Main Street" }),
    );
    finish?.({ ok: true, value: restaurant });
    await waitFor(() => expect(submit).not.toHaveAttribute("aria-busy", "true"));
  });
});

describe("RestaurantSettingsForm", () => {
  it("keeps Category read-only, reports dirty state, and resets after save", async () => {
    const user = userEvent.setup();
    const restaurant = buildOwnerRestaurant();
    const onDirtyChange = vi.fn();
    const onSubmit = vi.fn(async () => ({
      ok: true as const,
      value: { ...restaurant, name: "Updated restaurant" },
    }));
    render(
      <RestaurantSettingsForm
        onDirtyChange={onDirtyChange}
        onSubmit={onSubmit}
        restaurant={restaurant}
      />,
    );
    expect(screen.getByLabelText("Category")).toBeDisabled();
    expect(screen.getByText("Category can’t be changed.")).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    const name = screen.getByLabelText("Restaurant name");
    await user.clear(name);
    await user.type(name, "Updated restaurant");
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    await user.click(save);
    expect(await screen.findByText("Restaurant updated.")).toBeInTheDocument();
    await waitFor(() => expect(save).toBeDisabled());
  });
});

describe("OwnerRestaurantsPage CRUD", () => {
  it("navigates to create and deletes only the selected restaurant after confirmation", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    const navigate = vi.fn();
    render(
      <Provider store={createOwnerSelectionTestStore()}>
        <OwnerRestaurantsPage navigate={navigate} repository={repository} />
      </Provider>,
    );
    await screen.findByRole("heading", { name: buildOwnerRestaurant().name });
    await user.click(screen.getByRole("button", { name: "Create restaurant" }));
    expect(navigate).toHaveBeenCalledWith("/restaurants/new");
    await user.click(screen.getByRole("button", { name: "Delete restaurant" }));
    expect(
      screen.getByText(
        "This permanently removes the restaurant and its menu. This action can’t be undone.",
      ),
    ).toBeInTheDocument();
    const dangerButtons = screen.getAllByRole("button", { name: "Delete restaurant" });
    await user.click(dangerButtons.at(-1)!);
    await waitFor(() => expect(repository.delete).toHaveBeenCalledWith(buildOwnerRestaurant().id));
    expect(await screen.findByText("Create your first restaurant")).toBeInTheDocument();
  });
});

describe("DishForm field arrays", () => {
  it("adds nested option and choice rows with stable UI keys", async () => {
    const user = userEvent.setup();
    const restaurant = buildOwnerRestaurant();
    render(<DishForm onCancel={vi.fn()} onSubmit={vi.fn()} onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Add option" }));
    expect(screen.getByLabelText("Option name")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Choice name")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add choice" }));
    expect(screen.getAllByLabelText("Choice name")).toHaveLength(2);
    const removeChoices = screen.getAllByRole("button", { name: "Remove choice" });
    await user.click(removeChoices[0]!);
    expect(screen.getAllByLabelText("Choice name")).toHaveLength(1);
    expect(restaurant.dishes).toHaveLength(1);
  });

  it("warns when removing an existing option without mutating the dish snapshot", async () => {
    const user = userEvent.setup();
    const dish = buildOwnerRestaurant().dishes[0]!;
    const original = JSON.stringify(dish);
    render(<DishForm dish={dish} onCancel={vi.fn()} onSubmit={vi.fn()} onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove option" }));
    expect(
      screen.getByText("Past orders keep their saved option snapshots and are not changed."),
    ).toBeInTheDocument();
    expect(JSON.stringify(dish)).toBe(original);
  });
});

describe("OwnerOrdersAction", () => {
  it("refetches authoritative order after a failed mutation and never advances optimistically", async () => {
    const user = userEvent.setup();
    const pending = buildOwnerOrder();
    const authoritative = { ...pending, status: "PENDING" as const };
    const repository = {
      updateStatus: vi.fn(async () => {
        throw new Error("offline");
      }),
      get: vi.fn(async () => ({ kind: "found" as const, order: authoritative })),
    };
    const onOrder = vi.fn();
    render(<OwnerOrdersAction onOrder={onOrder} order={pending} repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Start preparing" }));
    expect(repository.updateStatus).toHaveBeenCalledWith(pending.id, "COOKING");
    await waitFor(() => expect(repository.get).toHaveBeenCalledWith(pending.id));
    expect(onOrder).toHaveBeenCalledWith(authoritative);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t update this order. Try again.",
    );
  });
});

describe("RestaurantSelector", () => {
  it("renders an explicit empty option", () => {
    render(
      <Provider store={createOwnerSelectionTestStore()}>
        <RestaurantSelector restaurants={[]} />
      </Provider>,
    );
    expect(screen.getByRole("option", { name: "No restaurants" })).toBeInTheDocument();
  });

  it("updates selection and invokes the optional composition callback", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const restaurant = buildOwnerRestaurant();
    render(
      <Provider store={createOwnerSelectionTestStore()}>
        <RestaurantSelector onSelect={onSelect} restaurants={[restaurant]} />
      </Provider>,
    );
    await user.selectOptions(screen.getByLabelText("Current restaurant"), restaurant.id);
    expect(onSelect).toHaveBeenCalledWith(restaurant.id);
  });

  it("updates the shared selection when no composition callback is provided", async () => {
    const user = userEvent.setup();
    const restaurant = buildOwnerRestaurant();
    render(
      <Provider store={createOwnerSelectionTestStore()}>
        <RestaurantSelector restaurants={[restaurant]} />
      </Provider>,
    );

    const selector = screen.getByLabelText("Current restaurant");
    await user.selectOptions(selector, restaurant.id);
    expect(selector).toHaveValue(restaurant.id);
  });
});
