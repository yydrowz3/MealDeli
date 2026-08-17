import { BrandLink } from "./brand-link";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function OwnerLayout(props: LayoutProps & { ownerName?: string; onLogOut: () => void }) {
  return (
    <div className="app-shell app-owner-shell">
      <aside className="app-owner-sidebar">
        <BrandLink />
        <nav aria-label="Owner navigation"><NavigationLinks items={props.navigation} /></nav>
        <div className="app-owner-account">
          {props.ownerName ? <span>{props.ownerName}</span> : null}
          <button onClick={props.onLogOut} type="button">Log out</button>
        </div>
      </aside>
      <main className="app-main">{props.children}</main>
      <nav aria-label="Owner mobile navigation" className="app-bottom-nav">
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
