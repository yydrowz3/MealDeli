import { Provider } from "jotai";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildOrder } from "../../orders/testing";
import type { CourierRepository } from "../api/courier-repository";
import { createCourierRouteTestStore } from "../model/route-atoms";
import { CourierDashboardPage } from "./courier-dashboard-page";
import { DeliveryPage } from "./delivery-page";

function waitingOrder(id = "waiting-1") {
  return buildOrder({ id, status: "WAITING", courierId: null });
}

function activeOrder(id = "active-1") {
  return buildOrder({ id, status: "PICKED", courierId: "courier-1" });
}

function createRepository(overrides: Partial<CourierRepository> = {}): CourierRepository {
  return {
    availableOrders: vi.fn().mockResolvedValue([]),
    listOrders: vi.fn().mockResolvedValue([]),
    getOrder: vi.fn().mockResolvedValue({ kind: "not-found" }),
    takeOrder: vi.fn().mockResolvedValue({ kind: "success" }),
    completeOrder: vi.fn().mockResolvedValue({ kind: "success" }),
    ...overrides,
  };
}

function installMatchMedia(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: reduced,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => installMatchMedia(false));

describe("CourierDashboardPage", () => {
  it("refetches authoritative state when the page becomes visible", async () => {
    const availableOrders = vi.fn().mockResolvedValue([]);
    const repository = createRepository({ availableOrders });
    render(<CourierDashboardPage onNavigateDelivery={vi.fn()} repository={repository} />);
    await screen.findByRole("heading", { name: "No orders available" });
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(availableOrders).toHaveBeenCalledTimes(2));
  });

  it("loads existing available, active and recent deliveries in parallel", async () => {
    const waiting = waitingOrder();
    const active = activeOrder();
    const delivered = buildOrder({ id: "delivered", status: "DELIVERED", courierId: "courier-1" });
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValue([waiting]),
      listOrders: vi
        .fn()
        .mockImplementation((status) =>
          Promise.resolve(status === "PICKED" ? [active] : [delivered]),
        ),
    });
    render(<CourierDashboardPage onNavigateDelivery={vi.fn()} repository={repository} />);
    expect(await screen.findAllByRole("heading", { name: "Jade Kitchen" })).toHaveLength(2);
    expect(screen.getByText("Active delivery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept order" })).toBeDisabled();
    expect(
      screen.getByText("Complete your active delivery before accepting another order."),
    ).toBeInTheDocument();
    expect(repository.availableOrders).toHaveBeenCalledOnce();
    expect(repository.listOrders).toHaveBeenCalledWith("PICKED");
    expect(repository.listOrders).toHaveBeenCalledWith("DELIVERED");
  });

  it("coordinates a competing accept and moves focus without accepting another order", async () => {
    const first = waitingOrder("first");
    const second = waitingOrder("second");
    const notifier = { info: vi.fn(), error: vi.fn() };
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValue([first, second]),
      takeOrder: vi.fn().mockResolvedValue({ kind: "no-longer-available" }),
    });
    render(
      <CourierDashboardPage
        notifier={notifier}
        onNavigateDelivery={vi.fn()}
        repository={repository}
      />,
    );
    const acceptButtons = await screen.findAllByRole("button", { name: "Accept order" });
    fireEvent.click(acceptButtons[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Accept order" })).toHaveLength(1),
    );
    expect(repository.takeOrder).toHaveBeenCalledTimes(1);
    expect(notifier.info).toHaveBeenCalledWith("This order was accepted by another courier.");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Jade Kitchen" })).toHaveFocus(),
    );
  });

  it("navigates after a successful accept and performs one mutation", async () => {
    const navigate = vi.fn();
    const takeOrder = vi.fn().mockResolvedValue({ kind: "success" });
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValue([waitingOrder("accepted")]),
      takeOrder,
    });
    render(<CourierDashboardPage onNavigateDelivery={navigate} repository={repository} />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept order" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("accepted"));
    expect(takeOrder).toHaveBeenCalledTimes(1);
  });

  it("refetches active delivery after the already-active result", async () => {
    const active = activeOrder("existing");
    const notifier = { info: vi.fn(), error: vi.fn() };
    let accepted = false;
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValue([waitingOrder("other")]),
      listOrders: vi
        .fn()
        .mockImplementation((status) =>
          Promise.resolve(status === "PICKED" && accepted ? [active] : []),
        ),
      takeOrder: vi.fn().mockImplementation(async () => {
        accepted = true;
        return { kind: "already-active" as const };
      }),
    });
    render(
      <CourierDashboardPage
        notifier={notifier}
        onNavigateDelivery={vi.fn()}
        repository={repository}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Accept order" }));
    expect(await screen.findByText("Active delivery")).toBeInTheDocument();
    expect(notifier.info).toHaveBeenCalledWith("You already have an active delivery.");
  });

  it("keeps the order available after a recoverable accept error", async () => {
    const notifier = { info: vi.fn(), error: vi.fn() };
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValue([waitingOrder("retry")]),
      takeOrder: vi.fn().mockResolvedValue({ kind: "error" }),
    });
    render(
      <CourierDashboardPage
        notifier={notifier}
        onNavigateDelivery={vi.fn()}
        repository={repository}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Accept order" }));
    await waitFor(() =>
      expect(notifier.error).toHaveBeenCalledWith("We couldn’t accept this order. Try again."),
    );
    expect(screen.getByRole("button", { name: "Accept order" })).toBeEnabled();
  });

  it("reconciles a timeout without automatically repeating takeOrder", async () => {
    const waiting = waitingOrder("claimed");
    const claimed = activeOrder("claimed");
    const navigate = vi.fn();
    let accepted = false;
    const takeOrder = vi.fn().mockImplementation(async () => {
      accepted = true;
      return { kind: "timeout" as const };
    });
    const repository = createRepository({
      availableOrders: vi.fn().mockResolvedValueOnce([waiting]).mockResolvedValueOnce([]),
      listOrders: vi
        .fn()
        .mockImplementation((status) =>
          Promise.resolve(status === "PICKED" && accepted ? [claimed] : []),
        ),
      takeOrder,
    });
    render(<CourierDashboardPage onNavigateDelivery={navigate} repository={repository} />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept order" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("claimed"));
    expect(repository.takeOrder).toHaveBeenCalledTimes(1);
  });
});

describe("DeliveryPage", () => {
  it("cleans up its two-second route timer on unmount", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const order = activeOrder();
    const repository = createRepository({
      getOrder: vi.fn().mockResolvedValue({ kind: "found", order }),
    });
    const view = render(
      <Provider store={createCourierRouteTestStore()}>
        <DeliveryPage
          courierId="courier-1"
          onBackDashboard={vi.fn()}
          orderId={order.id}
          repository={repository}
          renderMap={() => <div>Map</div>}
        />
      </Provider>,
    );
    await screen.findByRole("button", { name: "Complete delivery" });
    view.unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("disables automatic movement for reduced motion, supports manual advance and keeps completion available after map failure", async () => {
    installMatchMedia(true);
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const order = activeOrder();
    const repository = createRepository({
      getOrder: vi.fn().mockResolvedValue({ kind: "found", order }),
    });
    const store = createCourierRouteTestStore();
    render(
      <Provider store={store}>
        <DeliveryPage
          courierId="courier-1"
          onBackDashboard={vi.fn()}
          orderId={order.id}
          repository={repository}
          renderMap={({ route, onTileFailure, onSkipMap }) => (
            <div>
              <span>Progress {route.progressIndex}</span>
              <button onClick={onTileFailure}>Fail tiles</button>
              <button onClick={onSkipMap}>Skip map</button>
            </div>
          )}
        />
      </Provider>,
    );
    expect(await screen.findByText("Progress 0")).toBeInTheDocument();
    expect(intervalSpy.mock.calls.some((call) => call[1] === 2_000)).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Advance demo route" }));
    expect(screen.getByText("Progress 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fail tiles" }));
    expect(
      screen.getByText("Map tiles are unavailable. The demo route is still active."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete delivery" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Skip map" }));
    expect(screen.getByRole("heading", { name: "Jade Kitchen" }).closest("section")).toHaveFocus();
  });

  it.each([
    ["success", "success"],
    ["idempotent", "already-delivered"],
  ] as const)("treats %s completion as successful", async (_label, resultKind) => {
    const order = activeOrder();
    const repository = createRepository({
      getOrder: vi.fn().mockResolvedValue({ kind: "found", order }),
      completeOrder: vi.fn().mockResolvedValue({ kind: resultKind }),
    });
    render(
      <Provider store={createCourierRouteTestStore()}>
        <DeliveryPage
          courierId="courier-1"
          onBackDashboard={vi.fn()}
          orderId={order.id}
          repository={repository}
          renderMap={() => <div>Map</div>}
        />
      </Provider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Complete delivery" }));
    const buttons = screen.getAllByRole("button", { name: "Complete delivery" });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(await screen.findByRole("heading", { name: "Delivery completed" })).toBeInTheDocument();
    expect(repository.completeOrder).toHaveBeenCalledOnce();
  });

  it("clears and leaves when assignment is lost", async () => {
    const order = activeOrder();
    const back = vi.fn();
    const lost = vi.fn();
    const repository = createRepository({
      getOrder: vi.fn().mockResolvedValue({ kind: "found", order }),
      completeOrder: vi.fn().mockResolvedValue({ kind: "assignment-lost" }),
    });
    render(
      <Provider store={createCourierRouteTestStore()}>
        <DeliveryPage
          courierId="courier-1"
          onAssignmentLost={lost}
          onBackDashboard={back}
          orderId={order.id}
          repository={repository}
          renderMap={() => <div>Map</div>}
        />
      </Provider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Complete delivery" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Complete delivery" }).at(-1)!);
    await waitFor(() => expect(back).toHaveBeenCalledOnce());
    expect(lost).toHaveBeenCalledOnce();
  });

  it("reconciles completion timeout by querying once and never repeats the mutation", async () => {
    const order = activeOrder();
    const delivered = { ...order, status: "DELIVERED" as const };
    const repository = createRepository({
      getOrder: vi
        .fn()
        .mockResolvedValueOnce({ kind: "found", order })
        .mockResolvedValueOnce({ kind: "found", order: delivered }),
      completeOrder: vi.fn().mockResolvedValue({ kind: "timeout" }),
    });
    render(
      <Provider store={createCourierRouteTestStore()}>
        <DeliveryPage
          courierId="courier-1"
          onBackDashboard={vi.fn()}
          orderId={order.id}
          repository={repository}
          renderMap={() => <div>Map</div>}
        />
      </Provider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Complete delivery" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Complete delivery" }).at(-1)!);
    expect(await screen.findByRole("heading", { name: "Delivery completed" })).toBeInTheDocument();
    expect(repository.completeOrder).toHaveBeenCalledTimes(1);
    expect(repository.getOrder).toHaveBeenCalledTimes(2);
  });
});
