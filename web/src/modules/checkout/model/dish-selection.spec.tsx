import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { buildDish, buildDishChoice, buildDishOption } from "../../catalog";
import { DishCustomizer } from "../components/dish-customizer";
import {
  createCartLineFromSelection,
  createDishSelectionSchema,
  getDishSelectionTotalMinor,
} from "./dish-selection";

const dish = buildDish({
  options: [
    buildDishOption({
      id: "size",
      name: "Size",
      choices: [
        buildDishChoice({ id: "regular", name: "Regular", extraMinor: 0 }),
        buildDishChoice({ id: "large", name: "Large", extraMinor: 250 }),
      ],
    }),
    buildDishOption({
      id: "extras",
      name: "Extras",
      minSelections: 0,
      maxSelections: 2,
      choices: [
        buildDishChoice({ id: "egg", name: "Egg", extraMinor: 100 }),
        buildDishChoice({ id: "kimchi", name: "Kimchi", extraMinor: 75 }),
        buildDishChoice({ id: "tofu", name: "Tofu", extraMinor: 125 }),
      ],
    }),
  ],
});

describe("dish selection schema", () => {
  it("enforces field-array ownership, min/max, and duplicate choices/options", () => {
    const schema = createDishSelectionSchema(dish);
    expect(schema.safeParse({ quantity: 1, selections: [{ optionId: "size", choiceIds: [] }] }).success).toBe(false);
    expect(
      schema.safeParse({
        quantity: 1,
        selections: [
          { optionId: "size", choiceIds: ["regular"] },
          { optionId: "extras", choiceIds: ["egg", "egg"] },
        ],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        quantity: 1,
        selections: [
          { optionId: "size", choiceIds: ["regular"] },
          { optionId: "size", choiceIds: ["large"] },
        ],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        quantity: 1,
        selections: [
          { optionId: "size", choiceIds: ["not-owned"] },
          { optionId: "extras", choiceIds: [] },
        ],
      }).success,
    ).toBe(false);
  });

  it("calculates cents and creates a snapshot with a fixed UUID", () => {
    const values = {
      quantity: 2,
      selections: [
        { optionId: "size", choiceIds: ["large"] },
        { optionId: "extras", choiceIds: ["egg", "kimchi"] },
      ],
    };
    expect(getDishSelectionTotalMinor(dish, values)).toBe((1_299 + 250 + 100 + 75) * 2);
    expect(createCartLineFromSelection(dish, values, () => "fixed-uuid")).toMatchObject({
      lineId: expect.stringContaining("fixed-uuid"),
      quantity: 2,
      basePriceMinor: 1_299,
    });
  });
});

describe("DishCustomizer", () => {
  it("uses field arrays, respects max, displays cents, and submits once valid", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<DishCustomizer dish={dish} onAdd={onAdd} uuid={() => "fixed-uuid"} />);
    expect(screen.getByRole("button", { name: /Add 1 to cart · \$12\.99/ })).toBeVisible();
    await user.click(screen.getByRole("radio", { name: /Large/ }));
    await user.click(screen.getByRole("checkbox", { name: /Egg/ }));
    await user.click(screen.getByRole("checkbox", { name: /Kimchi/ }));
    expect(screen.getByRole("checkbox", { name: /Tofu/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByRole("button", { name: /Add 2 to cart · \$34\.48/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Add 2 to cart/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ quantity: 2, lineId: expect.stringContaining("fixed-uuid") });
  });

  it("focuses the first invalid option group", async () => {
    const user = userEvent.setup();
    render(<DishCustomizer dish={dish} onAdd={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Add 1 to cart/ }));
    await waitFor(() => expect(screen.getByRole("group", { name: "Size" })).toHaveFocus());
  });
});
