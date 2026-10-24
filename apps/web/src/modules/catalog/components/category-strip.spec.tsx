import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildCategory } from "../testing/fixtures";
import { CategoryStrip } from "./category-strip";

describe("CategoryStrip", () => {
  it("renders the database image and only uses the placeholder when image is absent", () => {
    render(
      <CategoryStrip
        categories={[
          buildCategory({
            image:
              "https://cn-geo1.uber.com/static/mobile-content/eats/cuisine-filters/v1/Korean.png",
          }),
          buildCategory({ id: "category-fast-food", name: "Fast Food", image: null }),
        ]}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole("img", { name: "Korean" })).toHaveAttribute(
      "src",
      "https://cn-geo1.uber.com/static/mobile-content/eats/cuisine-filters/v1/Korean.png",
    );
    expect(screen.getByRole("img", { name: "MealDeli placeholder for Fast Food" })).toBeVisible();
  });
});
