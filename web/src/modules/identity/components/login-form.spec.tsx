import { Provider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createIdentityTestStore, sessionUserAtom } from "../model/session-atoms";
import { buildSessionUser, createFakeIdentityRepository } from "../testing/fixtures";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it.each([
    ["CUSTOMER", "/restaurants"],
    ["OWNER", "/dashboard"],
    ["COURIER", "/dashboard"],
  ] as const)("authenticates %s and navigates to %s", async (role, destination) => {
    const user = userEvent.setup();
    const store = createIdentityTestStore();
    const navigate = vi.fn();
    const repository = createFakeIdentityRepository({
      me: vi.fn().mockResolvedValue({ ok: true, value: buildSessionUser({ role }) }),
    });
    render(
      <Provider store={store}>
        <LoginForm navigate={navigate} repository={repository} store={store} />
      </Provider>,
    );

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "alex@example.test");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(destination));
    expect(store.get(sessionUserAtom)?.role).toBe(role);
  });

  it("uses a safe return target and blocks an incompatible target", async () => {
    const user = userEvent.setup();
    const login = async (returnTo: string) => {
      const store = createIdentityTestStore();
      const navigate = vi.fn();
      const result = render(
        <Provider store={store}>
          <LoginForm
            navigate={navigate}
            repository={createFakeIdentityRepository()}
            returnTo={returnTo}
            store={store}
          />
        </Provider>,
      );
      await user.type(screen.getByRole("textbox", { name: "Email address" }), "alex@example.test");
      await user.type(screen.getByLabelText("Password"), "password");
      await user.click(screen.getByRole("button", { name: "Log in" }));
      await waitFor(() => expect(navigate).toHaveBeenCalled());
      result.unmount();
      return navigate;
    };

    expect(await login("/checkout")).toHaveBeenCalledWith("/checkout");
    expect(await login("//evil.example")).toHaveBeenCalledWith("/restaurants");
  });

  it("keeps an unverified user authenticated without entering a workspace", async () => {
    const user = userEvent.setup();
    const store = createIdentityTestStore();
    const navigate = vi.fn();
    render(
      <Provider store={store}>
        <LoginForm
          navigate={navigate}
          repository={createFakeIdentityRepository({
            me: vi.fn().mockResolvedValue({
              ok: true,
              value: buildSessionUser({ verifiedAt: null }),
            }),
          })}
          store={store}
        />
      </Provider>,
    );
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "alex@example.test");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(store.get(sessionUserAtom)?.verifiedAt).toBeNull());
    expect(navigate).not.toHaveBeenCalled();
  });
});
