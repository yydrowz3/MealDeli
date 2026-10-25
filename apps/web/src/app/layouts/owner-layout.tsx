import { useI18n } from "../../shared/i18n";
import { BrandLink } from "./brand-link";
import { AppControls } from "./app-controls";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function OwnerLayout(props: LayoutProps & { ownerName?: string; onLogOut: () => void }) {
  const { t, text } = useI18n();
  return (
    <div className="min-h-screen grid grid-cols-[15rem_minmax(0,1fr)] [@media(max-width:63.999rem)]:block">
      <header className="sticky top-0 z-20 hidden min-h-16 items-center justify-between gap-3 border-b border-solid border-border bg-warm-white px-4 py-3 [@media(max-width:63.999rem)]:flex">
        <BrandLink />
        <AppControls />
      </header>
      <aside className="sticky top-0 flex h-dvh flex-col gap-8 self-start overflow-y-auto bg-sidebar p-6 text-on-sidebar [@media(max-width:63.999rem)]:hidden">
        <BrandLink />
        <nav
          aria-label={t("app.ownerNavigation")}
          className="grid gap-2 [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
        >
          <NavigationLinks items={props.navigation} />
        </nav>
        <div className="mt-auto grid gap-2">
          <AppControls />
          {props.ownerName ? <span>{text(props.ownerName)}</span> : null}
          <button onClick={props.onLogOut} type="button">
            {t("common.logOut")}
          </button>
        </div>
      </aside>
      <main className="mx-auto max-w-content px-4 pt-8 pb-24">{text(props.children)}</main>
      <nav
        aria-label={t("app.ownerMobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-25 hidden justify-around border-t border-solid border-t-border bg-surface py-2 px-[max(var(--space-3),env(safe-area-inset-bottom))] [@media(max-width:63.999rem)]:flex [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
