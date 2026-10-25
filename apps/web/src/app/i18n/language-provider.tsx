import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import type { i18n } from "i18next";
import { I18nextProvider } from "react-i18next";
import { defaultI18n, parseLanguage } from "../../shared/i18n";
import { LANGUAGE_STORAGE_KEY, readLanguage } from "./language-preference";

export function LanguageProvider({
  children,
  instance = defaultI18n,
}: {
  children: ReactNode;
  instance?: i18n;
}) {
  // Resources are bundled, so initialization and language changes are synchronous.
  useState(() => {
    void instance.changeLanguage(readLanguage());
  });

  useLayoutEffect(() => {
    const syncDocument = () => {
      document.documentElement.lang = parseLanguage(instance.resolvedLanguage ?? instance.language);
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", instance.t("ui.description"));
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      void instance.changeLanguage(parseLanguage(event.newValue));
    };
    syncDocument();
    instance.on("languageChanged", syncDocument);
    window.addEventListener("storage", syncStorage);
    return () => {
      instance.off("languageChanged", syncDocument);
      window.removeEventListener("storage", syncStorage);
    };
  }, [instance]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
