import { useI18n } from "../../shared/i18n";
import type { ReactNode } from "react";
import { BrandLink } from "./brand-link";
import { AppControls } from "./app-controls";

export function GuestLayout({ children }: { children: ReactNode }) {
  const { t, text } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-warm-white">
        <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-3 px-4 py-3 md:min-h-18">
          <BrandLink />
          <nav
            aria-label={t("app.guestNavigation")}
            className="flex items-center gap-6 [&_a]:font-semibold"
          >
            <AppControls />
            <a href="/login">{t("common.logIn")}</a>
            <a
              className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-transparent bg-jade px-6 py-0 text-on-primary hover:bg-jade-dark hover:text-on-primary-hover font-semibold max-sm:hidden"
              href="/signup"
            >
              {t("common.signUp")}
            </a>
          </nav>
        </div>
      </header>
      {text(children)}
    </div>
  );
}
