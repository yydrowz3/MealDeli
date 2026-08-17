import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { Provider, createStore } from "jotai";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createIdentityTestStore, identityAtom, setAuthenticatedAtom } from "../modules/identity";
import { AppErrorBoundary } from "./errors/app-error-boundary";
import { OnlineRequired } from "./errors/online-required";
import { ChunkLoadErrorPage, OfflinePage, StartupErrorPage } from "./errors/startup-error-page";
import { CourierLayout } from "./layouts/courier-layout";
import { CustomerLayout } from "./layouts/customer-layout";
import { GuestLayout } from "./layouts/guest-layout";
import { OwnerLayout } from "./layouts/owner-layout";
import { AppProviders } from "./providers/app-providers";
import { registerPwa, usePwaUpdatePrompt } from "./pwa/update-controller";
import { PrivateContentGate } from "./routing/private-content-gate";
import { RequireAccess } from "./routing/require-access";

describe("Platform rendered states", () => {
  it("renders all role shells, navigation states, badges, and actions", async () => {
    const user = userEvent.setup();
    const onCartOpen = vi.fn();
    const onLogOut = vi.fn();
    const navigation = [
      { label: "Dashboard", href: "/dashboard", current: true, badge: 2 },
      { label: "Profile", href: "/profile" },
    ];
    render(
      <>
        <GuestLayout><span>guest content</span></GuestLayout>
        <CustomerLayout cartCount={3} navigation={navigation} onCartOpen={onCartOpen}>
          customer content
        </CustomerLayout>
        <OwnerLayout navigation={navigation} onLogOut={onLogOut} ownerName="Owner Name">
          owner content
        </OwnerLayout>
        <CourierLayout
          activeDeliveryHref="/deliveries/order-1"
          navigation={navigation}
          onLogOut={onLogOut}
        >
          courier content
        </CourierLayout>
      </>,
    );
    expect(screen.getByText("guest content")).toBeInTheDocument();
    expect(screen.getAllByLabelText("2 new")).toHaveLength(6);
    expect(screen.getByText("Owner Name")).toBeInTheDocument();
    expect(screen.getByText(/Continue delivery/)).toHaveAttribute("href", "/deliveries/order-1");
    await user.click(screen.getByRole("button", { name: "Cart, 3 items" }));
    await user.click(screen.getAllByRole("button", { name: "Log out" })[0]!);
    expect(onCartOpen).toHaveBeenCalledOnce();
    expect(onLogOut).toHaveBeenCalledOnce();
  });

  it("renders startup, offline, chunk, and caught root errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Broken = () => {
      throw new Error("boom");
    };
    render(
      <>
        <StartupErrorPage />
        <OfflinePage />
        <ChunkLoadErrorPage />
        <AppErrorBoundary><Broken /></AppErrorBoundary>
      </>,
    );
    expect(screen.getByText("MealDeli isn’t configured correctly.")).toBeInTheDocument();
    expect(screen.getByText("You’re offline. Connect to continue.")).toBeInTheDocument();
    expect(screen.getByText("We couldn’t load this part of MealDeli.")).toBeInTheDocument();
    expect(screen.getByText("MealDeli couldn’t open this page.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("switches OnlineRequired without losing its shell state", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    render(<OnlineRequired><div>online content</div></OnlineRequired>);
    expect(screen.getByText("online content")).toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText("You’re offline. Connect to continue.")).toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.getByText("online content")).toBeInTheDocument();
  });

  it("covers checking, role mismatch, redirect, and allowed private content", async () => {
    const user = userEvent.setup();
    const redirect = vi.fn();
    const checking = render(
      <PrivateContentGate decision={{ kind: "checking" }} onRedirect={redirect}>
        private
      </PrivateContentGate>,
    );
    expect(screen.getByLabelText("Checking your session")).toBeInTheDocument();
    checking.unmount();

    const mismatch = render(
      <PrivateContentGate
        decision={{ kind: "redirect", reason: "role", to: "/dashboard" }}
        onRedirect={redirect}
      >
        private
      </PrivateContentGate>,
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(redirect).toHaveBeenCalledWith("/dashboard");
    mismatch.unmount();

    const loginRedirect = render(
      <PrivateContentGate
        decision={{ kind: "redirect", reason: "login", to: "/login" }}
        onRedirect={redirect}
      >
        private
      </PrivateContentGate>,
    );
    expect(redirect).toHaveBeenCalledWith("/login");
    loginRedirect.unmount();

    render(
      <PrivateContentGate decision={{ kind: "allow" }} onRedirect={redirect}>
        allowed content
      </PrivateContentGate>,
    );
    expect(screen.getByText("allowed content")).toBeInTheDocument();
  });

  it("derives RequireAccess from the shared identity store", () => {
    const store = createIdentityTestStore();
    store.set(setAuthenticatedAtom, {
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER",
        verifiedAt: "2026-08-17T00:00:00.000Z",
        address: null,
        image: null,
      },
    });
    render(
      <Provider store={store}>
        <RequireAccess route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["CUSTOMER"] }}>
          gated content
        </RequireAccess>
      </Provider>,
    );
    expect(store.get(identityAtom).status).toBe("authenticated");
    expect(screen.getByText("gated content")).toBeInTheDocument();
  });

  it("mounts the provider order around application content", () => {
    const services = {
      apolloClient: new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() }),
      jotaiStore: createStore(),
      runtimeConfig: {
        apiHttpUrl: "http://localhost/graphql",
        apiWsUrl: "ws://localhost/graphql",
        appOrigin: "http://localhost",
      },
      dispose: vi.fn(),
    };
    render(<AppProviders services={services}><span>provider content</span></AppProviders>);
    expect(screen.getByText("provider content")).toBeInTheDocument();
  });
});

describe("PWA update controller", () => {
  it("returns a no-op controller when service workers are unavailable", async () => {
    const original = navigator.serviceWorker;
    Reflect.deleteProperty(navigator, "serviceWorker");
    const controller = await registerPwa(vi.fn());
    await expect(controller.activateWaiting()).resolves.toBeUndefined();
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: original });
  });

  it("exposes explicit refresh and dismiss actions from the hook", async () => {
    const activateWaiting = vi.fn().mockResolvedValue(undefined);
    let notify: (() => void) | undefined;
    const registrar = vi.fn(async (onNeedRefresh: () => void) => {
      notify = onNeedRefresh;
      return { activateWaiting };
    });
    const { result } = renderHook(() => usePwaUpdatePrompt(registrar));
    await act(async () => undefined);
    act(() => notify?.());
    expect(result.current.updateReady).toBe(true);
    await act(async () => result.current.reload());
    expect(activateWaiting).toHaveBeenCalledOnce();
    act(() => result.current.dismiss());
    expect(result.current.updateReady).toBe(false);
  });

  it("detects waiting and newly installed workers, then activates explicitly", async () => {
    const notify = vi.fn();
    const postMessage = vi.fn();
    let updateFound: (() => void) | undefined;
    let stateChange: (() => void) | undefined;
    let controllerChange: (() => void) | undefined;
    const installing = {
      state: "installed",
      addEventListener: vi.fn((_name: string, listener: () => void) => {
        stateChange = listener;
      }),
    };
    const registration = {
      waiting: { postMessage },
      installing,
      addEventListener: vi.fn((_name: string, listener: () => void) => {
        updateFound = listener;
      }),
    };
    const serviceWorker = {
      controller: {},
      register: vi.fn(async () => registration),
      addEventListener: vi.fn((_name: string, listener: () => void) => {
        controllerChange = listener;
      }),
    };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
    const controller = await registerPwa(notify);
    expect(notify).toHaveBeenCalledOnce();
    updateFound?.();
    stateChange?.();
    expect(notify).toHaveBeenCalledTimes(2);
    const activation = controller.activateWaiting();
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    controllerChange?.();
    await activation;
  });

  it("does nothing when a registration has no waiting worker", async () => {
    const serviceWorker = {
      controller: null,
      register: vi.fn(async () => ({
        waiting: null,
        installing: null,
        addEventListener: vi.fn(),
      })),
      addEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
    const controller = await registerPwa(vi.fn());
    await expect(controller.activateWaiting()).resolves.toBeUndefined();
  });
});
