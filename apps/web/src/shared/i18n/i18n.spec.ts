import { describe, expect, it, vi } from "vitest";
import { createI18n, errorMessage, message, parseLanguage, resources, resolveMessage } from ".";
import { formatUsd } from "../ui/data/money";
import { formatDateTime } from "../ui/data/date-time";
import { createCustomerOrderStatusNotifier } from "../../modules/orders/model/customer-notifier";
import { buildOrder } from "../../modules/orders/testing/fixtures";

function tokens(value: string) {
  return [...value.matchAll(/\{\{\s*([^},]+)(?:,[^}]+)?\}\}/g)]
    .map((match) => match[1].trim())
    .sort();
}

describe("bundled translations", () => {
  it.each(["zh-CN", "ja"] as const)(
    "keeps %s keys, interpolation, and rich-text slots complete",
    (language) => {
      const english = resources.en.translation;
      const translated = resources[language].translation;
      expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
      for (const group of Object.keys(english) as (keyof typeof english)[]) {
        expect(Object.keys(translated[group]).sort()).toEqual(Object.keys(english[group]).sort());
        for (const [key, source] of Object.entries(english[group])) {
          const target = (translated[group] as Record<string, string>)[key];
          expect(target.trim(), `${language}:${group}.${key}`).not.toBe("");
          expect(tokens(target), `${language}:${group}.${key}`).toEqual(tokens(source));
          expect([...target.matchAll(/<([a-z]+)\s*\/>/g)].map((match) => match[1]).sort()).toEqual(
            [...source.matchAll(/<([a-z]+)\s*\/>/g)].map((match) => match[1]).sort(),
          );
        }
      }
    },
  );

  it("uses English without browser-language detection and rejects unsupported settings", () => {
    expect(createI18n().language).toBe("en");
    expect([null, undefined, "zh-TW", "fr", "ja-JP", ""].map(parseLanguage)).toEqual(
      Array(6).fill("en"),
    );
  });

  it("falls back to English and isolates resources between instances", () => {
    const first = createI18n("ja");
    first.removeResourceBundle("ja", "translation");
    expect(first.t("common.logIn")).toBe("Log in");
    expect(createI18n("ja").t("common.logIn")).toBe("ログイン");
  });

  it("supports plural counts and resolves saved messages in the current language", async () => {
    const instance = createI18n();
    const saved = message("app.cartItems", { count: 1 });
    expect(resolveMessage(saved, instance)).toBe("Cart, 1 item");
    expect(resolveMessage(message("app.cartItems", { count: 1200 }), instance)).toBe(
      "Cart, 1,200 items",
    );
    await instance.changeLanguage("zh-CN");
    expect(resolveMessage(saved, instance)).toBe("购物车，1 件商品");
    await instance.changeLanguage("ja");
    expect(resolveMessage(saved, instance)).toBe("カート、1点");
    expect(resolveMessage("Restaurant called Orders", instance)).toBe("Restaurant called Orders");
    expect(resolveMessage("@mealdeli:not-json", instance)).toBe("@mealdeli:not-json");
  });

  it("uses local messages for unknown errors without mutating diagnostic information", () => {
    const original = new Error("Database detail");
    expect(resolveMessage(errorMessage(original, "owner.saveFailed"), createI18n("ja"))).toBe(
      "変更を保存できませんでした。",
    );
    expect(original.message).toBe("Database detail");
  });

  it("resolves notification text at emission time without resetting deduplication", async () => {
    const instance = createI18n();
    const notify = vi.fn();
    const emit = createCustomerOrderStatusNotifier(notify, (value) =>
      resolveMessage(value, instance),
    );
    emit(buildOrder({ status: "WAITING" }));
    expect(notify).toHaveBeenLastCalledWith({
      title: "Ready for pickup",
      description: "Your order is ready for pickup.",
    });
    await instance.changeLanguage("ja");
    emit(buildOrder({ status: "WAITING" }));
    expect(notify).toHaveBeenCalledTimes(1);
    emit(buildOrder({ status: "PICKED" }));
    expect(notify).toHaveBeenLastCalledWith({
      title: "配達中",
      description: "ご注文は配達中です。",
    });
  });
});

describe("localized formatting", () => {
  it.each(["zh-CN", "ja-JP"])("keeps USD cents exact for %s", (locale) => {
    expect(formatUsd(0, locale)).toContain("0.00");
    expect(formatUsd(5, locale)).toContain("0.05");
    expect(formatUsd(-5, locale)).toBe(locale === "ja-JP" ? "-$0.05" : "-US$0.05");
    expect(formatUsd(Number.MAX_SAFE_INTEGER, locale)).toContain("90,071,992,547,409.91");
    expect(formatUsd(-125, locale)).toContain("1.25");
    expect(() => formatUsd(1.5, locale)).toThrow(TypeError);
  });

  it("uses locale date conventions while honoring explicit time zones", () => {
    const date = "2026-08-16T23:30:00Z";
    expect(formatDateTime(date, { locale: "en-US", timeZone: "UTC" })).toBe(
      "Aug 16, 2026, 11:30 PM",
    );
    expect(formatDateTime(date, { locale: "zh-CN", timeZone: "UTC" })).toContain("23:30");
    expect(formatDateTime(date, { locale: "ja-JP", timeZone: "Asia/Tokyo" })).toContain(
      "2026年8月17日",
    );
  });
});
