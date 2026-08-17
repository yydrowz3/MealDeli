import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PwaUpdatePrompt } from "./register";
import type { PwaRegistrar } from "./update-controller";

describe("PWA update prompt", () => {
  it("waits for an explicit Reload action after an update becomes ready", async () => {
    let notifyUpdate!: () => void;
    const activateWaiting = vi.fn(() => Promise.resolve());
    const register: PwaRegistrar = vi.fn(async (notify) => {
      notifyUpdate = notify;
      return { activateWaiting };
    });
    const user = userEvent.setup();
    render(<PwaUpdatePrompt register={register} />);

    expect(screen.queryByText("A new version is ready.")).not.toBeInTheDocument();
    expect(activateWaiting).not.toHaveBeenCalled();

    await act(async () => notifyUpdate());
    expect(screen.getByText("A new version is ready.")).toBeInTheDocument();
    expect(activateWaiting).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(activateWaiting).toHaveBeenCalledTimes(1);
  });
});
