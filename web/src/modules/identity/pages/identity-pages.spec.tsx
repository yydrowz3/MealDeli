import { Provider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createIdentityTestStore } from "../model/session-atoms";
import type { IdentityRepository, SessionUser } from "../model/types";
import { CheckEmail } from "../components/check-email";
import { LoginPage } from "./login-page";
import { ProfilePage } from "./profile-page";
import { SignupPage } from "./signup-page";

const user: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Meal User",
  role: "CUSTOMER",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: "1 Jade Way",
  image: null,
};

function repository(overrides: Partial<IdentityRepository> = {}): IdentityRepository {
  return {
    refreshAccessToken: vi.fn(async () => ({ ok: false as const, code: "UNAUTHORIZED" as const, message: "No session" })),
    me: vi.fn(async () => ({ ok: true as const, value: user })),
    signIn: vi.fn(async () => ({ ok: true as const, value: "token" })),
    signUp: vi.fn(async () => ({ ok: true as const, value: undefined })),
    signOut: vi.fn(async () => ({ ok: true as const, value: undefined })),
    verifyEmail: vi.fn(async () => ({ ok: true as const, value: undefined })),
    resendVerification: vi.fn(async () => ({ ok: true as const, value: undefined })),
    editProfile: vi.fn(async () => ({ ok: true as const, value: undefined })),
    ...overrides,
  };
}

function pageStore(nextUser: SessionUser | null) {
  return createIdentityTestStore(
    nextUser
      ? { status: "authenticated", accessToken: "token", user: nextUser }
      : { status: "anonymous", accessToken: null, user: null },
  );
}

describe("Identity page shells", () => {
  it("renders the post-signup email message and both optional actions", async () => {
    const event = userEvent.setup();
    const onBackToLogin = vi.fn();
    const onLogout = vi.fn();
    render(
      <CheckEmail
        email={user.email}
        onBackToLogin={onBackToLogin}
        onLogout={onLogout}
        repository={repository()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/The link expires in 1 hour/)).toBeInTheDocument();
    await event.click(screen.getByRole("button", { name: "Back to log in" }));
    await event.click(screen.getByRole("button", { name: "Log out" }));
    expect(onBackToLogin).toHaveBeenCalledOnce();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("shows Login for guests and the verification gate for an unverified session", async () => {
    const guest = pageStore(null);
    const first = render(
      <Provider store={guest}>
        <LoginPage navigate={vi.fn()} repository={repository()} store={guest} />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    first.unmount();

    const unverified = pageStore({ ...user, verifiedAt: null });
    render(
      <Provider store={unverified}>
        <LoginPage navigate={vi.fn()} repository={repository()} store={unverified} />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Verify your email to continue." })).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("renders role selection and role-specific Signup headings", () => {
    const first = render(<SignupPage navigate={vi.fn()} repository={repository()} role={null} />);
    expect(screen.getByRole("heading", { name: "Choose how you want to use MealDeli" })).toBeInTheDocument();
    first.unmount();
    render(<SignupPage navigate={vi.fn()} repository={repository()} role="OWNER" />);
    expect(screen.getByRole("heading", { name: "Create your owner account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose a different role" })).toBeInTheDocument();
  });

  it("renders Profile from the shared session and logs out locally before navigation", async () => {
    const event = userEvent.setup();
    const store = pageStore(user);
    const navigate = vi.fn();
    const repo = repository();
    render(
      <Provider store={store}>
        <ProfilePage navigate={navigate} repository={repo} store={store} />
      </Provider>,
    );
    expect(screen.getByDisplayValue("Meal User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Customer")).toBeDisabled();
    await event.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => expect(repo.signOut).toHaveBeenCalledWith("token"));
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});
