import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Check } from "@phosphor-icons/react";
import { describe, expect, it, vi } from "vitest";

import {
  Badge,
  ChartFrame,
  ConnectionBanner,
  EmptyState,
  ErrorState,
  MapFrame,
  Skeleton,
  toastAdapter,
  ToastViewport,
} from "..";

describe("feedback components", () => {
  it("renders actionable empty and error states with the correct button priority", async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    const retry = vi.fn();
    render(
      <>
        <EmptyState
          action={{ label: "Add restaurant", onClick: create }}
          description="Create your first restaurant."
          icon={<Check />}
          title="No restaurants yet"
        />
        <ErrorState
          action={{ label: "Try again", onClick: retry }}
          title="We couldn’t load orders"
        />
      </>,
    );

    expect(screen.getByRole("heading", { name: "No restaurants yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first restaurant.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add restaurant" })).toHaveClass(
      "ui-button--primary",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toHaveClass("ui-button--secondary");
    await user.click(screen.getByRole("button", { name: "Add restaurant" }));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(create).toHaveBeenCalledOnce();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("uses a polite non-focus-stealing connection status and decorative skeleton", () => {
    const { rerender, container } = render(<ConnectionBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Live updates are reconnecting…");
    expect(screen.getByRole("status")).not.toHaveFocus();

    rerender(<ConnectionBanner className="custom" message="Back online." />);
    expect(screen.getByRole("status")).toHaveClass("ui-connection-banner", "custom");
    expect(screen.getByRole("status")).toHaveTextContent("Back online.");

    rerender(<Skeleton data-testid="skeleton" />);
    expect(container.querySelector("[aria-hidden='true']")).toBe(screen.getByTestId("skeleton"));
  });

  it("renders badges with semantic tones and optional icons", () => {
    const { rerender } = render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toHaveAttribute("data-tone", "neutral");
    rerender(
      <Badge icon={<Check data-testid="badge-icon" />} tone="success">
        Complete
      </Badge>,
    );
    expect(screen.getByText("Complete")).toHaveAttribute("data-tone", "success");
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });

  it("exposes a business-agnostic Sonner adapter", () => {
    const action = vi.fn();
    render(<ToastViewport />);
    expect(toastAdapter.success("Saved.")).toBeTruthy();
    expect(
      toastAdapter.error("Failed.", { action: { label: "Retry", onClick: action } }),
    ).toBeTruthy();
    expect(toastAdapter.info("Reconnecting…")).toBeTruthy();
  });
});

describe("ChartFrame", () => {
  it("always provides a title and visible text summary", () => {
    render(
      <ChartFrame
        description="The last seven days."
        summary="Revenue rose on Friday."
        title="Revenue"
      >
        <div>chart canvas</div>
      </ChartFrame>,
    );

    expect(screen.getByRole("figure", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText("The last seven days.")).toBeInTheDocument();
    expect(screen.getByText("Revenue rose on Friday.")).toBeInTheDocument();
    expect(screen.getByText("chart canvas")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading chart"],
    ["empty", "Nothing to plot"],
    ["error", "Chart failed"],
  ] as const)("renders an injected %s slot", (state, slotText) => {
    const slots = {
      loadingSlot: <div>Loading chart</div>,
      emptySlot: <div>Nothing to plot</div>,
      errorSlot: <div>Chart failed</div>,
    };
    render(
      <ChartFrame {...slots} state={state} summary="No hidden data." title="Orders">
        ready
      </ChartFrame>,
    );
    expect(screen.getByText(slotText)).toBeInTheDocument();
  });

  it("provides useful defaults for non-ready states", () => {
    const { rerender } = render(
      <ChartFrame state="loading" summary="Loading." title="Orders">
        ready
      </ChartFrame>,
    );
    expect(document.querySelector(".ui-skeleton")).toHaveAttribute("aria-hidden", "true");
    rerender(
      <ChartFrame state="empty" summary="Empty." title="Orders">
        ready
      </ChartFrame>,
    );
    expect(screen.getByRole("heading", { name: "No chart data yet" })).toBeInTheDocument();
    rerender(
      <ChartFrame state="error" summary="Failed." title="Orders">
        ready
      </ChartFrame>,
    );
    expect(
      screen.getByRole("heading", { name: "We couldn’t load this chart" }),
    ).toBeInTheDocument();
  });
});

describe("MapFrame", () => {
  it("supports map content, attribution, skip action, loading, and fallback", async () => {
    const user = userEvent.setup();
    const onSkipMap = vi.fn();
    const { rerender } = render(
      <MapFrame
        attribution="© OpenStreetMap contributors"
        onSkipMap={onSkipMap}
        title="Delivery route"
      >
        Map content
      </MapFrame>,
    );

    expect(screen.getByRole("region", { name: "Delivery route" })).toBeInTheDocument();
    expect(screen.getByText("Map content")).toBeInTheDocument();
    expect(screen.getByText("© OpenStreetMap contributors")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip map" }));
    expect(onSkipMap).toHaveBeenCalledOnce();

    rerender(
      <MapFrame
        loadingSlot={<div>Loading route</div>}
        onSkipMap={onSkipMap}
        state="loading"
        title="Route"
      >
        Map content
      </MapFrame>,
    );
    expect(screen.getByText("Loading route")).toBeInTheDocument();

    rerender(
      <MapFrame
        fallbackSlot={<div>Use written directions</div>}
        onSkipMap={onSkipMap}
        state="fallback"
        title="Route"
      >
        Map content
      </MapFrame>,
    );
    expect(screen.getByText("Use written directions")).toBeInTheDocument();
  });

  it("provides default loading and unavailable fallback content", () => {
    const { rerender } = render(
      <MapFrame onSkipMap={() => undefined} state="loading" title="Route">
        Map
      </MapFrame>,
    );
    expect(document.querySelector(".ui-skeleton")).toBeInTheDocument();
    rerender(
      <MapFrame onSkipMap={() => undefined} state="fallback" title="Route">
        Map
      </MapFrame>,
    );
    expect(screen.getByText("The map is unavailable.")).toBeInTheDocument();
  });
});
