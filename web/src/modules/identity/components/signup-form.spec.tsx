import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createFakeIdentityRepository } from "../testing/fixtures";
import { SignupForm } from "./signup-form";

describe("SignupForm", () => {
  it("requires role selection when the query role is absent", () => {
    render(
      <SignupForm
        onSuccess={() => undefined}
        repository={createFakeIdentityRepository()}
        role={null}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "How do you want to use MealDeli?" }),
    ).toBeVisible();
  });

  it("preselects a valid role and shows check-email on success callback", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const repository = createFakeIdentityRepository();
    render(<SignupForm onSuccess={onSuccess} repository={repository} role="OWNER" />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Full name" }), "Alex");
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "ALEX@example.test");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(
      screen.getByRole("checkbox", {
        name: "I understand this is a MealDeli demo account.",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("alex@example.test"));
    expect(repository.signUp).toHaveBeenCalledTimes(1);
    expect(repository.signUp).toHaveBeenCalledWith({
      email: "alex@example.test",
      name: "Alex",
      password: "12345678",
      role: "OWNER",
    });
  });

  it("prevents a second submit while the first request is pending", async () => {
    const user = userEvent.setup();
    let resolve!: (value: { ok: true; value: undefined }) => void;
    const signUp = vi
      .fn()
      .mockImplementation(
        () => new Promise<{ ok: true; value: undefined }>((done) => (resolve = done)),
      );
    render(
      <SignupForm
        onSuccess={() => undefined}
        repository={createFakeIdentityRepository({ signUp })}
        role="CUSTOMER"
      />,
    );
    await user.type(screen.getByRole("textbox", { name: "Full name" }), "Alex");
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "alex@example.test");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", { name: "Create account" });
    await user.dblClick(submit);
    expect(signUp).toHaveBeenCalledTimes(1);
    resolve({ ok: true, value: undefined });
  });
});
