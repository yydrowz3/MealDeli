import { ShoppingCartIcon } from "@phosphor-icons/react";

import { BrandLink } from "./brand-link";
import { NavigationLinks } from "./layout-types";
import type { LayoutProps } from "./layout-types";

export function CustomerLayout(props: LayoutProps & { cartCount: number; onCartOpen: () => void }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandLink />
        <nav aria-label="Customer navigation" className="app-desktop-nav">
          <NavigationLinks items={props.navigation} />
        </nav>
        <button aria-label={`Cart, ${props.cartCount} items`} className="app-cart-button" onClick={props.onCartOpen} type="button">
          <ShoppingCartIcon aria-hidden="true" size={24} weight="bold" />
          {props.cartCount > 0 ? <span>{props.cartCount}</span> : null}
        </button>
      </header>
      <main className="app-main">{props.children}</main>
      <nav aria-label="Customer mobile navigation" className="app-bottom-nav">
        <NavigationLinks items={props.navigation} />
      </nav>
    </div>
  );
}
