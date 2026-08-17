import { describe, expect, it } from "vitest";

import { buildDish, buildDishChoice, buildDishOption } from "../../catalog";
import { dishFormSchema, dishToFormValues, toDishWriteDraft } from "./dish-form-schema";
import { parseUsdToMinor } from "./money";

describe("strict USD parser", () => {
  it.each([
    ["0", 0],
    ["0.00", 0],
    ["12.3", 1230],
    ["12.34", 1234],
  ])("parses %s without floating point rounding", (input, minor) => {
    expect(parseUsdToMinor(input)).toEqual({ ok: true, minor });
  });

  it.each(["-1", "1.001", "1e2", ".50", "01.00", "90071992547410.00"])(
    "rejects invalid or unsafe value %s",
    (input) => expect(parseUsdToMinor(input).ok).toBe(false),
  );
});

describe("dish option draft", () => {
  it("preserves API ids while keeping UI keys out of the write payload", () => {
    const dish = buildDish({
      options: [
        buildDishOption({
          id: "33333333-3333-4333-8333-333333333333",
          choices: [buildDishChoice({ id: "44444444-4444-4444-8444-444444444444" })],
        }),
      ],
    });
    let key = 0;
    const values = dishToFormValues(dish, () => `ui-${++key}`);
    const draft = toDishWriteDraft(values);
    expect(draft.options[0]?.id).toBe(dish.options[0]?.id);
    expect(draft.options[0]?.choices[0]?.id).toBe(dish.options[0]?.choices[0]?.id);
    expect(draft).not.toHaveProperty("uiKey");
    expect(JSON.stringify(draft)).not.toContain("ui-");
  });

  it("does not invent API ids for new rows", () => {
    const draft = toDishWriteDraft({
      name: "Soup",
      description: "Warm soup",
      price: "4.50",
      image: null,
      options: [
        {
          uiKey: "option-ui",
          name: "Size",
          minSelections: 1,
          maxSelections: 1,
          choices: [{ uiKey: "choice-ui", name: "Regular", extraPrice: "0.00" }],
        },
      ],
    });
    expect(draft.options[0]).not.toHaveProperty("id");
    expect(draft.options[0]?.choices[0]).not.toHaveProperty("id");
  });

  it("validates choice cardinality and min/max bounds", () => {
    const base = {
      name: "Soup",
      description: "Warm soup",
      price: "4.50",
      image: null,
    };
    expect(
      dishFormSchema.safeParse({
        ...base,
        options: [{ uiKey: "x", name: "Size", minSelections: 0, maxSelections: 1, choices: [] }],
      }).success,
    ).toBe(false);
    expect(
      dishFormSchema.safeParse({
        ...base,
        options: [
          {
            uiKey: "x",
            name: "Size",
            minSelections: 2,
            maxSelections: 1,
            choices: [{ uiKey: "c", name: "One", extraPrice: "0" }],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      dishFormSchema.safeParse({
        ...base,
        options: [
          {
            uiKey: "x",
            name: "Size",
            minSelections: 0,
            maxSelections: 2,
            choices: [{ uiKey: "c", name: "One", extraPrice: "0" }],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
