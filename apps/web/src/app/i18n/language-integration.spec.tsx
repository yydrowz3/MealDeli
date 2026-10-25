import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { createI18n, message, useI18n } from "../../shared/i18n";
import { DateTime, Money, StatusBadge } from "../../shared/ui";
import { ThemeProvider } from "../theme/theme-provider";
import { GuestLayout } from "../layouts/guest-layout";
import { CustomerLayout } from "../layouts/customer-layout";
import { OwnerLayout } from "../layouts/owner-layout";
import { CourierLayout } from "../layouts/courier-layout";
import { LoginForm } from "../../modules/identity/components/login-form";
import {
  buildSessionUser,
  createFakeIdentityRepository,
} from "../../modules/identity/testing/fixtures";
import { identityAtom, setAuthenticatedAtom } from "../../modules/identity/model/session-atoms";
import { cartAtom, cartStorageAtom } from "../../modules/checkout/model/cart-atoms";
import { buildCart } from "../../modules/checkout/testing/fixtures";
import { CartSummary } from "../../modules/checkout/components/cart-summary";
import { PromotionCard } from "../../modules/owner-insights/components/promotion-card";
import { StartupErrorPage } from "../errors/startup-error-page";
import { AppErrorBoundary } from "../errors/app-error-boundary";
import { PwaUpdatePrompt } from "../pwa/register";
import { LanguageSwitch } from "./language-switch";

describe("translated application flows", () => {
  it("invalidates compiler-cached labels while old asynchronous callbacks use the latest language", async () => {
    const instance = createI18n();
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nextProvider i18n={instance}>{children}</I18nextProvider>,
    });
    const originalT = result.current.t;
    const originalText = result.current.text;
    await act(() => instance.changeLanguage("ja"));
    expect(result.current.t).not.toBe(originalT);
    expect(result.current.text).not.toBe(originalText);
    expect(originalT("common.logIn")).toBe("ログイン");
    expect(originalText(message("common.logIn"))).toBe("ログイン");
  });
  it.each(["guest", "customer", "owner", "courier"] as const)(
    "offers live language switching in the %s shell",
    async (role) => {
      const instance = createI18n();
      const content = <StatusBadge status="PICKED" />;
      const shell =
        role === "guest" ? (
          <GuestLayout>{content}</GuestLayout>
        ) : role === "customer" ? (
          <CustomerLayout navigation={[]} cartCount={1} onCartOpen={vi.fn()}>
            {content}
          </CustomerLayout>
        ) : role === "owner" ? (
          <OwnerLayout navigation={[]} onLogOut={vi.fn()}>
            {content}
          </OwnerLayout>
        ) : (
          <CourierLayout navigation={[]} onLogOut={vi.fn()}>
            {content}
          </CourierLayout>
        );
      render(
        <I18nextProvider i18n={instance}>
          <ThemeProvider>{shell}</ThemeProvider>
        </I18nextProvider>,
      );
      await userEvent.setup().selectOptions(screen.getAllByRole("combobox")[0], "zh-CN");
      expect(screen.getByText("配送中")).toBeInTheDocument();
      for (const select of screen.getAllByRole("combobox", { name: "语言" }))
        expect(select).toHaveValue("zh-CN");
      await userEvent.setup().selectOptions(screen.getAllByRole("combobox")[0], "ja");
      expect(screen.getByText("配達中")).toBeInTheDocument();
    },
  );

  it("translates existing validation errors without resetting entered form values", async () => {
    const user = userEvent.setup();
    const instance = createI18n();
    render(
      <I18nextProvider i18n={instance}>
        <LanguageSwitch />
        <LoginForm repository={createFakeIdentityRepository()} navigate={vi.fn()} />
      </I18nextProvider>,
    );
    await user.type(screen.getByLabelText("Email address"), "invalid-address");
    await user.tab();
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "zh-CN");
    expect(screen.getByText("请输入有效的邮箱地址。")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱地址")).toHaveValue("invalid-address");
    await user.selectOptions(screen.getByRole("combobox"), "ja");
    expect(screen.getByText("有効なメールアドレスを入力してください。")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("invalid-address");
  });

  it("preserves authenticated state, cart contents, and business names during switching", async () => {
    const instance = createI18n();
    const store = createStore();
    const cart = buildCart();
    store.set(cartStorageAtom, cart);
    store.set(setAuthenticatedAtom, { accessToken: "test", user: buildSessionUser() });
    const snapshot = store.get(identityAtom);
    render(
      <I18nextProvider i18n={instance}>
        <Provider store={store}>
          <LanguageSwitch />
          <CartSummary cart={cart} />
        </Provider>
      </I18nextProvider>,
    );
    await userEvent.setup().selectOptions(screen.getByRole("combobox"), "ja");
    expect(screen.getByText("Bibimbap")).toBeInTheDocument();
    expect(screen.getByText("合計")).toBeInTheDocument();
    expect(store.get(cartAtom)).toEqual(cart);
    expect(store.get(identityAtom)).toBe(snapshot);
  });

  it("updates dates, currencies and rich-text promotion copy", async () => {
    const instance = createI18n();
    render(
      <I18nextProvider i18n={instance}>
        <DateTime value="2026-08-16T23:30:00Z" timeZone="UTC" />
        <Money minor={12345} />
        <PromotionCard
          restaurant={{ id: "r", name: "Orders", promotedUntil: null }}
          active={false}
          onPromote={vi.fn()}
        />
      </I18nextProvider>,
    );
    expect(screen.getByText("$123.45")).toBeInTheDocument();
    await act(() => instance.changeLanguage("ja"));
    expect(screen.getByText(/2026年8月16日/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /プロモーションを開始/ })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("@mealdeli:");
  });

  it("uses translated startup, render-error and update prompts", async () => {
    const instance = createI18n("zh-CN");
    const startup = render(
      <I18nextProvider i18n={instance}>
        <ThemeProvider>
          <StartupErrorPage />
        </ThemeProvider>
      </I18nextProvider>,
    );
    expect(screen.getByText("MealDeli 配置有误。")).toBeInTheDocument();
    startup.unmount();
    vi.spyOn(console, "error").mockImplementation(() => {});
    function Broken(): never {
      throw new Error("Test render error");
    }
    const boundary = render(
      <I18nextProvider i18n={instance}>
        <ThemeProvider>
          <AppErrorBoundary>
            <Broken />
          </AppErrorBoundary>
        </ThemeProvider>
      </I18nextProvider>,
    );
    expect(screen.getByText("MealDeli 无法打开此页面。")).toBeInTheDocument();
    await userEvent.setup().selectOptions(screen.getByRole("combobox"), "ja");
    expect(screen.getByText("MealDeliでこのページを開けませんでした。")).toBeInTheDocument();
    boundary.unmount();
    render(
      <I18nextProvider i18n={instance}>
        <PwaUpdatePrompt
          register={async (onNeedRefresh) => {
            onNeedRefresh();
            return { activateWaiting: async () => {} };
          }}
        />
      </I18nextProvider>,
    );
    expect(await screen.findByText("新しいバージョンが利用できます。")).toBeInTheDocument();
  });
});
