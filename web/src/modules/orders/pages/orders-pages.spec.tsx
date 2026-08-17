import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../../../shared/ui";
import { buildOrder, buildOrdersByStatus } from "../testing/fixtures";
import { ORDER_STATUSES } from "../model/types";
import { ORDER_STATUS_LABELS } from "../model/status-machine";
import { OrderDetailPage } from "./order-detail-page";
import { OrdersPage } from "./orders-page";

describe("OrdersPage", () => {
  it("renders Customer Current/Past states and actions", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(
      <OrdersPage
        onViewOrder={onView}
        role="CUSTOMER"
        state={{ kind: "ready", orders: buildOrdersByStatus() }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Your orders" })).toBeInTheDocument();
    expect(screen.getByText("On the way")).toBeInTheDocument();
    expect(screen.queryByText("Delivered")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Past" }));
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View order" }));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ status: "DELIVERED" }));
  });

  it("renders Owner restaurant/status filters and an injected row action", async () => {
    const user = userEvent.setup();
    const first = buildOrder({ id: "owner-first", restaurantId: "a", status: "PENDING" });
    const second = buildOrder({ id: "owner-second", restaurantId: "b", status: "COOKING" });
    render(
      <OrdersPage
        renderAction={(order) => <Button>Handle {order.id}</Button>}
        restaurants={[{ id: "a", name: "Jade Kitchen" }, { id: "b", name: "Green Table" }]}
        role="OWNER"
        state={{ kind: "ready", orders: [first, second] }}
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Restaurant" }), "a");
    expect(screen.getByText("#owner-fi")).toBeInTheDocument();
    expect(screen.queryByText("#owner-se")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "PENDING");
    expect(screen.getByRole("button", { name: "Handle owner-first" })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "DELIVERED");
    expect(screen.getByRole("heading", { name: "No orders found" })).toBeInTheDocument();
  });

  it("renders Courier Active/Completed and empty states", async () => {
    const user = userEvent.setup();
    render(<OrdersPage role="COURIER" state={{ kind: "ready", orders: buildOrdersByStatus() }} />);
    expect(screen.getByRole("heading", { name: "Delivery history" })).toBeInTheDocument();
    expect(screen.getByText("On the way")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByText("Delivered")).toBeInTheDocument();

    render(<OrdersPage role="COURIER" state={{ kind: "ready", orders: [] }} />);
    expect(screen.getByRole("heading", { name: "No active delivery" })).toBeInTheDocument();
  });

  it("renders loading and retryable error states", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(<OrdersPage role="CUSTOMER" state={{ kind: "loading" }} />);
    expect(screen.getByLabelText("Loading orders")).toBeInTheDocument();
    rerender(
      <OrdersPage
        onRetry={retry}
        role="CUSTOMER"
        state={{ kind: "error", message: "Network unavailable." }}
      />,
    );
    expect(screen.getByText("Network unavailable.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("OrderDetailPage", () => {
  it.each(ORDER_STATUSES)("renders the shared five-stage timeline at %s", (status) => {
    render(
      <OrderDetailPage
        role="CUSTOMER"
        state={{ kind: "ready", order: buildOrder({ status }) }}
      />,
    );
    const timeline = screen.getByRole("list", { name: "Order progress" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(5);
    expect(within(timeline).getByRole("listitem", { current: "step" })).toHaveTextContent(
      ORDER_STATUS_LABELS[status],
    );
    expect(screen.getByText("Payment completed in demo mode.")).toBeInTheDocument();
  });

  it("shows items, summary, reconnect state, and an action slot", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <OrderDetailPage
        actionSlot={(order) => <Button onClick={action}>Act on {order.id}</Button>}
        connectionState="reconnecting"
        role="OWNER"
        state={{ kind: "ready", order: buildOrder() }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Live updates are reconnecting…");
    expect(screen.getByRole("heading", { name: "Jade Kitchen" })).toBeInTheDocument();
    expect(screen.getByText("2 × Garden bowl")).toBeInTheDocument();
    expect(screen.queryByText("Payment completed in demo mode.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Act on order-00000001" }));
    expect(action).toHaveBeenCalledOnce();
  });

  it("does not disclose whether a missing order was forbidden", async () => {
    const user = userEvent.setup();
    const back = vi.fn();
    render(<OrderDetailPage onBack={back} role="COURIER" state={{ kind: "not-found" }} />);
    expect(screen.getByRole("heading", { name: "Order not found" })).toBeInTheDocument();
    expect(screen.getByText(/doesn’t exist or isn’t available/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to orders" }));
    expect(back).toHaveBeenCalledOnce();
  });

  it("renders detail loading and recoverable error states", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(<OrderDetailPage role="CUSTOMER" state={{ kind: "loading" }} />);
    expect(screen.getByLabelText("Loading order")).toBeInTheDocument();
    rerender(
      <OrderDetailPage
        onRetry={retry}
        role="CUSTOMER"
        state={{ kind: "error", message: "Try later." }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
