import { useI18n } from "../../shared/i18n";
import { BrandLink } from "./brand-link";
import { AppControls } from "./app-controls";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function CourierLayout(
  props: LayoutProps & { activeDeliveryHref?: string; onLogOut: () => void },
) {
  const { t, text } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-warm-white">
        <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-3 px-4 py-3 md:min-h-18">
          <BrandLink />
          <nav
            aria-label={t("app.courierNavigation")}
            className="hidden items-center gap-6 lg:flex [&_a]:font-semibold"
          >
            <NavigationLinks items={props.navigation} />
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <AppControls />
            <button onClick={props.onLogOut} type="button">
              {t("common.logOut")}
            </button>
          </div>
        </div>
      </header>
      {props.activeDeliveryHref ? (
        <a
          className="block bg-jade-soft px-4 py-3 text-center font-bold"
          href={props.activeDeliveryHref}
        >
          {t("app.activeDeliveryLink")}
        </a>
      ) : null}
      <main className="mx-auto w-full min-w-0 max-w-content px-4 pt-8 pb-24">
        {text(props.children)}
      </main>
      <nav
        aria-label={t("app.courierMobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-25 flex justify-around gap-1 border-t border-border bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden [&_a]:flex [&_a]:min-h-11 [&_a]:flex-col [&_a]:items-center [&_a]:justify-center [&_a]:gap-1 [&_a]:p-1 [&_a]:text-small"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
