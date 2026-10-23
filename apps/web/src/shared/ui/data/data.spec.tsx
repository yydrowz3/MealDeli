import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DateTime,
  formatDateTime,
  formatUsd,
  getOrderStatusPresentation,
  Money,
  StatusBadge,
} from "..";
import type { OrderStatus } from "..";

describe("money presentation", () => {
  it("formats integer cents exactly, including negative and large safe values", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(5)).toBe("$0.05");
    expect(formatUsd(1299)).toBe("$12.99");
    expect(formatUsd(-125)).toBe("-$1.25");
    expect(formatUsd(Number.MAX_SAFE_INTEGER)).toBe("$90,071,992,547,409.91");
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid minor units (%s)",
    (minor) => {
      expect(() => formatUsd(minor)).toThrow(TypeError);
    },
  );

  it("renders money with tabular-number styling", () => {
    render(<Money className="total" minor={2500} />);
    expect(screen.getByText("$25.00")).toHaveClass("ui-money", "total");
  });
});

describe("date and time presentation", () => {
  const value = "2026-08-16T23:30:00.000Z";

  it("supports deterministic locale and time-zone injection", () => {
    expect(formatDateTime(value, { locale: "en-US", timeZone: "America/Los_Angeles" })).toBe(
      "Aug 16, 2026, 4:30 PM",
    );
  });

  it("renders a machine-readable datetime and optional relative label", () => {
    render(
      <DateTime
        locale="en-US"
        relativeLabel="2 hours ago"
        timeZone="UTC"
        value={new Date(value)}
      />,
    );
    const time = screen.getByText("Aug 16, 2026, 11:30 PM (2 hours ago)");
    expect(time).toHaveAttribute("datetime", value);
  });

  it.each(["not-a-date", new Date(Number.NaN)])("rejects invalid dates", (invalid) => {
    expect(() => formatDateTime(invalid)).toThrow(RangeError);
  });
});

describe("order status presentation", () => {
  const cases: [OrderStatus, string, string][] = [
    ["PENDING", "Order placed", "neutral"],
    ["COOKING", "Preparing your order", "jade"],
    ["WAITING", "Ready for pickup", "warning"],
    ["PICKED", "On the way", "info"],
    ["DELIVERED", "Delivered", "success"],
  ];

  it.each(cases)("renders %s with text, icon, and tone", (status, label, tone) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(getOrderStatusPresentation(status).label).toBe(label);
  });
});
