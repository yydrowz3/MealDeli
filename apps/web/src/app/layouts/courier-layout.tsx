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
      <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-solid border-b-border bg-[color-mix(in_srgb,var(--color-warm-white)_94%,transparent)] py-3 px-[max(var(--space-4),calc((100vw-var(--content-max-width))/2))] min-h-18 [@media(max-width:39.999rem)]:min-h-16">
        <BrandLink />
        <nav
          aria-label={t("app.courierNavigation")}
          className="flex items-center gap-6 [&_a]:font-[650] [&_a]:no-underline [@media(max-width:39.999rem)]:hidden"
        >
          <NavigationLinks items={props.navigation} />
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <AppControls />
          <button onClick={props.onLogOut} type="button">
            {t("common.logOut")}
          </button>
        </div>
      </header>
      {props.activeDeliveryHref ? (
        <a
          className="block bg-jade-soft px-4 py-3 text-center font-[700]"
          href={props.activeDeliveryHref}
        >
          {t("app.activeDeliveryLink")}
        </a>
      ) : null}
      <main className="mx-auto max-w-content px-4 pt-8 pb-24">{text(props.children)}</main>
      <nav
        aria-label={t("app.courierMobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-25 hidden justify-around border-t border-solid border-t-border bg-surface py-2 px-[max(var(--space-3),env(safe-area-inset-bottom))] [@media(max-width:63.999rem)]:flex [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
