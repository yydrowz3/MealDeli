import { BrandLink } from "./brand-link";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function OwnerLayout(props: LayoutProps & { ownerName?: string; onLogOut: () => void }) {
  return (
    <div className="min-h-screen grid grid-cols-[15rem_minmax(0,1fr)] [@media(max-width:63.999rem)]:block">
      <aside className="sticky top-0 flex min-h-screen flex-col gap-8 bg-charcoal p-6 text-surface [@media(max-width:63.999rem)]:hidden">
        <BrandLink />
        <nav
          aria-label="Owner navigation"
          className="grid gap-2 [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
        >
          <NavigationLinks items={props.navigation} />
        </nav>
        <div className="mt-auto grid gap-2">
          {props.ownerName ? <span>{props.ownerName}</span> : null}
          <button onClick={props.onLogOut} type="button">
            Log out
          </button>
        </div>
      </aside>
      <main className="mx-auto max-w-content px-4 pt-8 pb-24">{props.children}</main>
      <nav
        aria-label="Owner mobile navigation"
        className="fixed inset-x-0 bottom-0 z-25 hidden justify-around border-t border-solid border-t-border bg-surface py-2 px-[max(var(--space-3),env(safe-area-inset-bottom))] [@media(max-width:63.999rem)]:flex [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:p-2 [&_a]:no-underline"
      >
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
