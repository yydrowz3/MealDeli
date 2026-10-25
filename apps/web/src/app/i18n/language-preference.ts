import type { i18n } from "i18next";
import { defaultI18n, parseLanguage } from "../../shared/i18n";
import type { SupportedLanguage } from "../../shared/i18n";

export const LANGUAGE_STORAGE_KEY = "mealdeli.language";

export function readLanguage(): SupportedLanguage {
  try {
    return parseLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function changeLanguage(language: SupportedLanguage, instance: i18n = defaultI18n) {
  const next = parseLanguage(language);
  void instance.changeLanguage(next);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  } catch {
    // Current-page switching remains available when storage is blocked or full.
  }
}
