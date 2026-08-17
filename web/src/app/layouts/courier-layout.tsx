import { BrandLink } from "./brand-link";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function CourierLayout(props: LayoutProps & { activeDeliveryHref?: string; onLogOut: () => void }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandLink />
        <nav aria-label="Courier navigation" className="app-desktop-nav"><NavigationLinks items={props.navigation} /></nav>
        <button onClick={props.onLogOut} type="button">Log out</button>
      </header>
      {props.activeDeliveryHref ? (
        <a className="app-active-delivery" href={props.activeDeliveryHref}>Active delivery · Continue delivery</a>
      ) : null}
      <main className="app-main">{props.children}</main>
      <nav aria-label="Courier mobile navigation" className="app-bottom-nav"><NavigationLinks items={props.navigation} /></nav>
    </div>
  );
}
