import { describe, expect, it, vi } from "vitest";
import { createRefreshCoordinator } from "./refresh-coordinator";

describe("refresh coordinator", () => {
  it("shares one refresh across concurrent unauthorized operations", async () => {
    let resolveRefresh!: (token: string) => void;
    const refreshAccessToken = vi.fn(() => new Promise<string>((resolve) => { resolveRefresh = resolve; }));
    const onRefreshFailed = vi.fn();
    const coordinator = createRefreshCoordinator({ refreshAccessToken, onRefreshFailed });

    const first = coordinator.refresh();
    const second = coordinator.refresh();
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);

    resolveRefresh("fresh-token");
    await expect(Promise.all([first, second])).resolves.toEqual(["fresh-token", "fresh-token"]);
    expect(onRefreshFailed).not.toHaveBeenCalled();
  });

  it("clears private state exactly once when a shared refresh fails", async () => {
    let rejectRefresh!: (error: Error) => void;
    const refreshAccessToken = vi.fn(() => new Promise<string>((_resolve, reject) => { rejectRefresh = reject; }));
    const onRefreshFailed = vi.fn();
    const coordinator = createRefreshCoordinator({ refreshAccessToken, onRefreshFailed });

    const first = coordinator.refresh();
    const second = coordinator.refresh();
    rejectRefresh(new Error("expired"));

    await expect(first).rejects.toThrow("expired");
    await expect(second).rejects.toThrow("expired");
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onRefreshFailed).toHaveBeenCalledTimes(1);
  });
});
