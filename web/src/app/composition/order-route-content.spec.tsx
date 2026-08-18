import { Provider, createStore } from "jotai";
import type { WritableAtom } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const doubles = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  loadCheckout: vi.fn(),
  ownerPendingOrders: vi.fn(),
  courierReadyOrders: vi.fn(),
  orderUpdates: vi.fn(),
}));

vi.mock("../../modules/checkout", async () => {
  const { atom } = await import("jotai");
  return {
    cartAtom: atom({ version: 1, restaurant: null, lines: [] }),
    CheckoutPage: (props: { state: { kind: string } }) => (
      <div data-testid="checkout-page">{props.state.kind}</div>
    ),
    loadCheckout: doubles.loadCheckout,
  };
});

vi.mock("../../modules/identity", async () => {
  const { atom } = await import("jotai");
  return {
    sessionUserAtom: atom<null | {
      id: string;
      role: "CUSTOMER" | "OWNER" | "COURIER";
      verifiedAt: string;
      address: string | null;
    }>(null),
  };
});

vi.mock("../../modules/orders", () => ({
  OrdersPage: (props: {
    state: { kind: string; orders?: readonly TestOrder[] };
    renderAction?: (order: TestOrder) => unknown;
    onRetry?: () => void;
  }) => (
    <div data-testid="orders-page" data-kind={props.state.kind}>
      {props.state.orders?.[0]?.id}
      {props.state.orders?.[0] && props.renderAction
        ? (props.renderAction(props.state.orders[0]) as React.ReactNode)
        : null}
      <button onClick={props.onRetry}>retry orders</button>
    </div>
  ),
  OrderDetailPage: (props: {
    state: { kind: string; order?: TestOrder };
    actionSlot?: unknown;
    onRetry?: () => void;
  }) => (
    <div data-testid="order-detail" data-kind={props.state.kind}>
      {props.state.order?.id}
      {props.actionSlot as never}
      <button onClick={props.onRetry}>retry detail</button>
    </div>
  ),
}));

vi.mock("../../modules/owner-management", () => ({
  OwnerOrdersAction: (props: { order: TestOrder; onOrder: (order: TestOrder) => void }) => (
    <button onClick={() => props.onOrder({ ...props.order, status: "COOKING" })}>
      owner action
    </button>
  ),
}));

vi.mock("../../shared/ui", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("./app-runtime", async () => {
  const { createStore } = await import("jotai");
  const runtime = {
    orderRepository: { list: doubles.list, get: doubles.get, updateStatus: vi.fn() },
    orderSubscriptions: {
      ownerPendingOrders: doubles.ownerPendingOrders,
      courierReadyOrders: doubles.courierReadyOrders,
      orderUpdates: doubles.orderUpdates,
    },
    catalogRepository: {},
    identityRepository: {},
    orderCommandRepository: {},
    reconcileOrder: vi.fn(),
    services: { jotaiStore: createStore() },
  };
  return { getMealDeliRuntime: () => runtime };
});

import { cartAtom } from "../../modules/checkout";
import { sessionUserAtom, type SessionUser } from "../../modules/identity";
import {
  CheckoutRouteContent,
  OrderDetailRouteContent,
  OrdersRouteContent,
} from "./order-route-content";

type TestOrder = {
  id: string;
  restaurantId: string;
  restaurant: { name: string } | null;
  status: string;
};

const order: TestOrder = {
  id: "order-1",
  restaurantId: "restaurant-1",
  restaurant: { name: "Jade Kitchen" },
  status: "PENDING",
};

async function* emptyStream() {}

function renderWithStore(node: React.ReactNode, role: "CUSTOMER" | "OWNER" | "COURIER" = "OWNER") {
  const store = createStore();
  const writableSessionUserAtom = sessionUserAtom as unknown as WritableAtom<
    SessionUser | null,
    [SessionUser | null],
    void
  >;
  store.set(writableSessionUserAtom, {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    role,
    verifiedAt: "2026-08-17T00:00:00.000Z",
    address: "1 Jade Way",
    image: null,
  });
  return { store, ...render(<Provider store={store}>{node}</Provider>) };
}

describe("route content composition", () => {
  beforeEach(() => {
    doubles.list.mockReset().mockResolvedValue([order]);
    doubles.get.mockReset().mockResolvedValue({ kind: "found", order });
    doubles.loadCheckout.mockReset().mockResolvedValue({ kind: "empty" });
    doubles.ownerPendingOrders.mockReset().mockReturnValue(emptyStream());
    doubles.courierReadyOrders.mockReset().mockReturnValue(emptyStream());
    doubles.orderUpdates.mockReset().mockReturnValue(emptyStream());
  });

  it("loads owner orders, renders the owner action, and applies its authoritative result", async () => {
    const user = userEvent.setup();
    renderWithStore(<OrdersRouteContent />);
    expect(screen.getByTestId("orders-page")).toHaveAttribute("data-kind", "loading");
    await screen.findByText("order-1");
    await user.click(screen.getByRole("button", { name: "owner action" }));
    expect(screen.getByText("order-1")).toBeInTheDocument();
    expect(doubles.ownerPendingOrders).toHaveBeenCalledOnce();
  });

  it("uses the courier stream and exposes a retry after a list failure", async () => {
    const user = userEvent.setup();
    doubles.list.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    renderWithStore(<OrdersRouteContent />, "COURIER");
    await waitFor(() =>
      expect(screen.getByTestId("orders-page")).toHaveAttribute("data-kind", "error"),
    );
    await user.click(screen.getByRole("button", { name: "retry orders" }));
    await waitFor(() =>
      expect(screen.getByTestId("orders-page")).toHaveAttribute("data-kind", "ready"),
    );
    expect(doubles.courierReadyOrders).toHaveBeenCalledOnce();
  });

  it("does not subscribe the customer order list", async () => {
    renderWithStore(<OrdersRouteContent />, "CUSTOMER");
    await screen.findByText("order-1");
    expect(doubles.ownerPendingOrders).not.toHaveBeenCalled();
    expect(doubles.courierReadyOrders).not.toHaveBeenCalled();
  });

  it("loads a detail, applies a realtime refetch, and handles not-found", async () => {
    async function* oneUpdate() {
      yield { id: "order-1" };
    }
    doubles.orderUpdates.mockReturnValue(oneUpdate());
    doubles.get
      .mockResolvedValueOnce({ kind: "found", order })
      .mockResolvedValueOnce({ kind: "found", order: { ...order, status: "COOKING" } });
    const { unmount } = renderWithStore(<OrderDetailRouteContent orderId="order-1" />);
    await screen.findByText("order-1");
    await waitFor(() => expect(doubles.get).toHaveBeenCalledTimes(2));
    unmount();

    doubles.get.mockReset().mockResolvedValue({ kind: "not-found" });
    renderWithStore(<OrderDetailRouteContent orderId="missing" />, "CUSTOMER");
    await waitFor(() =>
      expect(screen.getByTestId("order-detail")).toHaveAttribute("data-kind", "not-found"),
    );
  });

  it("renders detail failures and retries", async () => {
    const user = userEvent.setup();
    doubles.get.mockRejectedValueOnce("offline").mockResolvedValueOnce({ kind: "found", order });
    renderWithStore(<OrderDetailRouteContent orderId="order-1" />, "CUSTOMER");
    await waitFor(() =>
      expect(screen.getByTestId("order-detail")).toHaveAttribute("data-kind", "error"),
    );
    await user.click(screen.getByRole("button", { name: "retry detail" }));
    await screen.findByText("order-1");
  });

  it("loads checkout from the current user and cart", async () => {
    const { store } = renderWithStore(<CheckoutRouteContent />, "CUSTOMER");
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    await screen.findByText("empty");
    expect(doubles.loadCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ role: "CUSTOMER" }),
        cart: store.get(cartAtom),
      }),
    );
  });
});
