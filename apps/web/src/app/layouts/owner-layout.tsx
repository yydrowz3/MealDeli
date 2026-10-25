import { useI18n } from "../../shared/i18n";
import { BrandLink } from "./brand-link";
import { AppControls } from "./app-controls";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function OwnerLayout(props: LayoutProps & { ownerName?: string; onLogOut: () => void }) {
  const { t, text } = useI18n();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-warm-white px-4 py-3 lg:hidden">
        <BrandLink />
        <AppControls />
      </header>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 self-start overflow-y-auto bg-sidebar p-6 text-on-sidebar lg:flex">
        <BrandLink />
        <nav
          aria-label={t("app.ownerNavigation")}
          className="grid gap-2 [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2"
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
      <main className="mx-auto w-full min-w-0 max-w-content px-4 pt-8 pb-24">
        {text(props.children)}
      </main>
      <nav
        aria-label={t("app.ownerMobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-25 flex justify-around gap-1 border-t border-border bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden [&_a]:flex [&_a]:min-h-11 [&_a]:flex-col [&_a]:items-center [&_a]:justify-center [&_a]:gap-1 [&_a]:p-1 [&_a]:text-small"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
