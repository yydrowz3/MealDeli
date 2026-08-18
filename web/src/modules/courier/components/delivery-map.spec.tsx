import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDemoRoute } from "../model/demo-route";
import { DeliveryMap } from "./delivery-map";

describe("DeliveryMap", () => {
  it("renders an accessible local fallback and Skip map action without loading tiles", () => {
    const onSkipMap = vi.fn();
    render(
      <DeliveryMap
        failed
        onSkipMap={onSkipMap}
        restaurantName="Jade Kitchen"
        route={createDemoRoute("order-1", 4)}
      />,
    );
    expect(screen.getByTestId("courier-map-fallback")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pickup: Jade Kitchen" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Demo delivery destination" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Simulated courier location" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip map" }));
    expect(onSkipMap).toHaveBeenCalledOnce();
  });
});
