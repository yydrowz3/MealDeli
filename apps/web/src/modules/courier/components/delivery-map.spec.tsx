import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "../../../shared/i18n";

import { createDemoRoute } from "../model/demo-route";
import { DeliveryMap } from "./delivery-map";

describe("DeliveryMap", () => {
  it("updates live-map marker and zoom-control names when the language changes", async () => {
    const instance = createI18n("ja");
    render(
      <I18nextProvider i18n={instance}>
        <DeliveryMap
          onSkipMap={vi.fn()}
          restaurantName="Jade Kitchen"
          route={createDemoRoute("order-1", 4)}
        />
      </I18nextProvider>,
    );
    expect(screen.getByRole("button", { name: "受け取り：Jade Kitchen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "拡大" })).toBeInTheDocument();
    await act(() => instance.changeLanguage("zh-CN"));
    expect(screen.getByRole("button", { name: "取餐：Jade Kitchen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "放大" })).toBeInTheDocument();
  });
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
