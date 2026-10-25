import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createI18n, useI18n } from "../../shared/i18n";
import { LanguageProvider } from "./language-provider";
import { LANGUAGE_STORAGE_KEY } from "./language-preference";
import { LanguageSwitch } from "./language-switch";

function Probe() {
  const { t } = useI18n();
  return (
    <>
      <LanguageSwitch />
      <p>{t("common.logIn")}</p>
    </>
  );
}

describe("language preferences", () => {
  it.each([null, "not-a-language", "zh-CN", "ja"])(
    "restores %s, defaulting to English",
    (saved) => {
      if (saved !== null) localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
      const instance = createI18n();
      render(
        <LanguageProvider instance={instance}>
          <Probe />
        </LanguageProvider>,
      );
      const expected = saved === "zh-CN" || saved === "ja" ? saved : "en";
      expect(screen.getByRole("combobox")).toHaveValue(expected);
      expect(document.documentElement.lang).toBe(expected);
    },
  );

  it("switches immediately, saves the preference, and restores it after remounting", async () => {
    const description = document.createElement("meta");
    description.name = "description";
    description.setAttribute("data-test-owned", "true");
    document.head.append(description);
    const user = userEvent.setup();
    const first = render(
      <LanguageProvider instance={createI18n()}>
        <Probe />
      </LanguageProvider>,
    );
    await user.selectOptions(screen.getByRole("combobox"), "zh-CN");
    expect(screen.getByText("登录")).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(description.content).toBe("让每个人都能轻松享受配送服务。");
    first.unmount();
    render(
      <LanguageProvider instance={createI18n()}>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
  });

  it("synchronizes changes, removals, and clear events across tabs", () => {
    render(
      <LanguageProvider instance={createI18n()}>
        <Probe />
      </LanguageProvider>,
    );
    const sync = (key: string | null, newValue: string | null) =>
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
      });
    sync("another.key", "ja");
    expect(screen.getByRole("combobox")).toHaveValue("en");
    sync(LANGUAGE_STORAGE_KEY, "ja");
    expect(screen.getByText("ログイン")).toBeInTheDocument();
    sync(LANGUAGE_STORAGE_KEY, null);
    expect(screen.getByRole("combobox")).toHaveValue("en");
    sync(LANGUAGE_STORAGE_KEY, "zh-CN");
    sync(null, null);
    expect(screen.getByRole("combobox")).toHaveValue("en");
  });

  it("keeps switching usable when browser storage throws", async () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(
      <LanguageProvider instance={createI18n()}>
        <Probe />
      </LanguageProvider>,
    );
    await userEvent.setup().selectOptions(screen.getByRole("combobox"), "ja");
    expect(screen.getByText("ログイン")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("ja");
  });
});
