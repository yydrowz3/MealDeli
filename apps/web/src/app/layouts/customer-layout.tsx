import { useI18n } from "../../shared/i18n";
import { ShoppingCartIcon } from "@phosphor-icons/react";

import { BrandLink } from "./brand-link";
import { AppControls } from "./app-controls";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function CustomerLayout(props: LayoutProps & { cartCount: number; onCartOpen: () => void }) {
  const { t, text, formatNumber } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-solid border-b-border bg-[color-mix(in_srgb,var(--color-warm-white)_94%,transparent)] py-3 px-[max(var(--space-4),calc((100vw-var(--content-max-width))/2))] min-h-18 [@media(max-width:39.999rem)]:min-h-16">
        <BrandLink />
        <nav
          aria-label={t("app.customerNavigation")}
          className="flex items-center gap-6 [&_a]:font-[650] [&_a]:no-underline [@media(max-width:39.999rem)]:hidden"
        >
          <NavigationLinks items={props.navigation} />
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <AppControls />
          <button
            aria-label={t("app.cartItems", { count: props.cartCount })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border-0 border-none bg-transparent p-2 text-inherit hover:text-action"
            onClick={props.onCartOpen}
            type="button"
          >
            <ShoppingCartIcon aria-hidden="true" size={24} weight="bold" />
            {props.cartCount > 0 ? <span>{formatNumber(props.cartCount)}</span> : null}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-content px-4 pt-8 pb-24">{text(props.children)}</main>
      <nav
        aria-label={t("app.customerMobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-25 hidden justify-around border-t border-solid border-t-border bg-surface py-2 px-[max(var(--space-3),env(safe-area-inset-bottom))] [@media(max-width:63.999rem)]:flex [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
