import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createFakeIdentityRepository } from "../testing/fixtures";
import { ResendForm } from "./resend-form";

describe("ResendForm", () => {
  it("shows the same success and applies a thirty second UI cooldown", async () => {
    vi.useFakeTimers();
    const repository = createFakeIdentityRepository();
    render(<ResendForm email="unknown@example.test" repository={repository} />);

    fireEvent.submit(screen.getByRole("button", { name: "Resend email" }).closest("form")!);
    await act(async () => Promise.resolve());

    expect(screen.getByText("Verification email sent.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Resend email in 30s" })).toBeDisabled();
    for (let second = 0; second < 30; second += 1) {
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(screen.getByRole("button", { name: "Resend email" })).toBeEnabled();
  });

  it("presents a recoverable network failure", async () => {
    const repository = createFakeIdentityRepository({
      resendVerification: vi.fn().mockResolvedValue({
        ok: false,
        code: "NETWORK",
        message: "offline",
      }),
    });
    render(<ResendForm email="alex@example.test" repository={repository} />);
    fireEvent.submit(screen.getByRole("button", { name: "Resend email" }).closest("form")!);
    await waitFor(() =>
      expect(screen.getByText("We couldn’t resend the email. Try again later.")).toBeVisible(),
    );
  });
});
