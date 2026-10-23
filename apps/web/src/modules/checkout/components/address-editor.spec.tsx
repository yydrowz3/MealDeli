import { Provider } from "jotai";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CommandResult, IdentityRepository, SessionUser } from "../../identity";
import { createIdentityTestStore } from "../../identity";
import { AddressEditor } from "./address-editor";

const customer: SessionUser = {
  id: "customer-1",
  email: "customer@example.test",
  name: "Customer",
  role: "CUSTOMER",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: null,
  image: null,
};

function ok<T = undefined>(value?: T): CommandResult<T> {
  return { ok: true, value: value as T };
}

function buildRepository(overrides: Partial<IdentityRepository> = {}): IdentityRepository {
  return {
    refreshAccessToken: vi.fn(),
    me: vi.fn().mockResolvedValue(ok({ ...customer, address: "10 Main Street" })),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    editProfile: vi.fn().mockResolvedValue(ok()),
    ...overrides,
  };
}

async function enterAndSave() {
  const actor = userEvent.setup();
  await actor.type(screen.getByRole("textbox", { name: "Delivery address" }), "10 Main Street");
  await actor.click(screen.getByRole("button", { name: "Save address" }));
}

describe("AddressEditor errors", () => {
  it("reports an expired session", async () => {
    const store = createIdentityTestStore();
    render(
      <Provider store={store}>
        <AddressEditor onSaved={vi.fn()} repository={buildRepository()} store={store} />
      </Provider>,
    );
    await enterAndSave();
    expect(await screen.findByText("Your session expired. Please log in again.")).toBeVisible();
  });

  it.each([
    ["edit", "We couldn’t save your address. Try again."],
    ["refresh", "We couldn’t refresh your profile. Try again."],
  ] as const)("reports a %s command failure", async (failure, expected) => {
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "token",
      user: customer,
    });
    const override: Partial<IdentityRepository> =
      failure === "edit"
        ? {
            editProfile: vi
              .fn()
              .mockResolvedValue({ ok: false, code: "UNKNOWN", message: "failed" }),
          }
        : { me: vi.fn().mockResolvedValue({ ok: false, code: "NETWORK", message: "offline" }) };
    render(
      <Provider store={store}>
        <AddressEditor onSaved={vi.fn()} repository={buildRepository(override)} store={store} />
      </Provider>,
    );
    await enterAndSave();
    expect(await screen.findByText(expected)).toBeVisible();
  });
});
