import { Provider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createIdentityTestStore } from "../model/session-atoms";
import { createFakeIdentityRepository } from "../testing/fixtures";
import { VerifyEmailPage } from "./verify-email-page";

describe("VerifyEmailPage", () => {
  it("does not submit when the token is missing", () => {
    const repository = createFakeIdentityRepository();
    render(<VerifyEmailPage navigate={() => undefined} repository={repository} />);
    expect(
      screen.getByRole("heading", { name: "This verification link is no longer valid" }),
    ).toBeVisible();
    expect(repository.verifyEmail).not.toHaveBeenCalled();
  });

  it("moves from loading to success", async () => {
    const store = createIdentityTestStore();
    render(
      <Provider store={store}>
        <VerifyEmailPage
          navigate={() => undefined}
          repository={createFakeIdentityRepository()}
          store={store}
          token={"a".repeat(64)}
        />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Verifying your email…" })).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Email verified" })).toBeVisible();
  });

  it("offers a bounded retry after a network error", async () => {
    const user = userEvent.setup();
    const verifyEmail = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, code: "NETWORK", message: "offline" })
      .mockResolvedValueOnce({ ok: true, value: undefined });
    render(
      <VerifyEmailPage
        navigate={() => undefined}
        repository={createFakeIdentityRepository({ verifyEmail })}
        token={"b".repeat(64)}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "We couldn’t verify your email" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(verifyEmail).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Email verified" })).toBeVisible();
  });
});
