import { createInstance } from "i18next";
import type { i18n } from "i18next";
import { useCallback, useContext } from "react";
import { I18nContext, initReactI18next, useTranslation } from "react-i18next";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";
import { ja } from "./locales/ja";
import type { SupportedLanguage, Translate, TranslationKey, TranslationValues } from "./types";

export type {
  SupportedLanguage,
  Translate,
  TranslationKey,
  TranslationResource,
  TranslationValues,
} from "./types";
export const supportedLanguages = ["en", "zh-CN", "ja"] as const;
export const resources = {
  en: { translation: en },
  "zh-CN": { translation: zhCN },
  ja: { translation: ja },
};
export const locales: Record<SupportedLanguage, string> = {
  en: "en-US",
  "zh-CN": "zh-CN",
  ja: "ja-JP",
};

export function parseLanguage(value: unknown): SupportedLanguage {
  return value === "zh-CN" || value === "ja" ? value : "en";
}

export function createI18n(language: SupportedLanguage = "en"): i18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources: structuredClone(resources),
    lng: language,
    supportedLngs: [...supportedLanguages],
    fallbackLng: "en",
    load: "currentOnly",
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}

// A storage-free English instance keeps standalone UI usable. The application
// provider also uses it so non-React event handlers observe language changes.
export const defaultI18n = createI18n();
export const translate: Translate = (key, values) =>
  (defaultI18n.t as unknown as Translate)(key, values);

const messagePrefix = "@mealdeli:";

/** Stable, serializable message reference for validation and persisted UI state. */
export function message(key: TranslationKey, values?: TranslationValues): string {
  return messagePrefix + JSON.stringify({ key, values });
}

/** Keep diagnostic errors intact and select a safe message for the interface. */
export function errorMessage(error: unknown, fallback: TranslationKey): string {
  const value =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? "localizedMessage" in error
          ? error.localizedMessage
          : "message" in error
            ? error.message
            : undefined
        : undefined;
  return typeof value === "string" && value.startsWith(messagePrefix) ? value : message(fallback);
}

/** Zod issues may also contain built-in diagnostics without an explicit message. */
export function validationMessage(value: string): string {
  return value.startsWith(messagePrefix) ? value : message("ui.invalidValue");
}

/** Resolve only our explicit references; never translate restaurant/user content. */
export function resolveMessage<T>(
  value: T,
  instance: i18n = defaultI18n,
  language = instance.resolvedLanguage ?? instance.language,
): T {
  if (typeof value !== "string" || !value.startsWith(messagePrefix)) return value;
  try {
    const descriptor = JSON.parse(value.slice(messagePrefix.length)) as {
      key: TranslationKey;
      values?: TranslationValues;
    };
    if (!instance.exists(descriptor.key)) return value;
    const values = Object.fromEntries(
      Object.entries(descriptor.values ?? {}).map(([key, item]) => [
        key,
        resolveMessage(item, instance, language),
      ]),
    );
    return (instance.t as unknown as Translate)(descriptor.key, { ...values, lng: language }) as T;
  } catch {
    return value;
  }
}

export function useI18n() {
  const context = useContext(I18nContext);
  const instance = context?.i18n ?? defaultI18n;
  // react-i18next returns a language snapshot wrapper. Use it to invalidate
  // renders, and keep the original instance for callbacks that outlive a render.
  const { i18n: snapshot } = useTranslation(undefined, { i18n: instance });
  const language = parseLanguage(snapshot.resolvedLanguage ?? snapshot.language);
  // Function identities change with language so React Compiler invalidates cached
  // labels. Old async callbacks still read the instance's current language.
  const t = useCallback<Translate>(
    (key, values) =>
      (instance.t as unknown as Translate)(key, {
        ...values,
        lng: instance.resolvedLanguage ?? language,
      }),
    [instance, language],
  );
  const text = useCallback(
    <T>(value: T): T => resolveMessage(value, instance, instance.resolvedLanguage ?? language),
    [instance, language],
  );
  return {
    t,
    text,
    i18n: instance,
    language,
    locale: locales[language],
    formatNumber: (value: number) => new Intl.NumberFormat(locales[language]).format(value),
  };
}
