import { describe, expect, it, vi } from "vitest";

import { buildOwnerOrder } from "../testing/fixtures";
import { getOwnerOrderAction } from "./order-actions";
import { createPendingOrderNotifier } from "./pending-notifier";

describe("owner order action policy", () => {
  it("only permits the two owner transitions", () => {
    expect(getOwnerOrderAction("PENDING")).toEqual({
      label: "Start preparing",
      targetStatus: "COOKING",
    });
    expect(getOwnerOrderAction("COOKING")).toEqual({
      label: "Mark ready for pickup",
      targetStatus: "WAITING",
    });
    expect(getOwnerOrderAction("WAITING")).toBeNull();
    expect(getOwnerOrderAction("PICKED")).toBeNull();
    expect(getOwnerOrderAction("DELIVERED")).toBeNull();
  });
});

describe("pending order notifier", () => {
  it("deduplicates, updates badge, dismisses, and removes a toast after COOKING", () => {
    const onToasts = vi.fn();
    const onPendingCount = vi.fn();
    const notifier = createPendingOrderNotifier({ onToasts, onPendingCount });
    const order = buildOwnerOrder();
    notifier.receive(order);
    notifier.receive(order);
    expect(onToasts.mock.lastCall?.[0]).toHaveLength(1);
    notifier.sync([order]);
    expect(onPendingCount).toHaveBeenLastCalledWith(1);
    notifier.dismiss(order.id);
    expect(onToasts.mock.lastCall?.[0]).toHaveLength(0);
    notifier.sync([{ ...order, status: "COOKING" }], true);
    expect(onPendingCount).toHaveBeenLastCalledWith(0);
    expect(onToasts.mock.lastCall?.[0]).toHaveLength(0);
  });

  it("adds missed PENDING orders during reconnect calibration and clears on dispose", () => {
    const onToasts = vi.fn();
    const onPendingCount = vi.fn();
    const notifier = createPendingOrderNotifier({ onToasts, onPendingCount });
    notifier.sync([buildOwnerOrder()], true);
    expect(onToasts.mock.lastCall?.[0]).toHaveLength(1);
    notifier.dispose();
    expect(onPendingCount).toHaveBeenLastCalledWith(0);
    expect(onToasts.mock.lastCall?.[0]).toHaveLength(0);
  });
});
