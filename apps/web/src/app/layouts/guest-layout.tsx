import type { ReactNode } from "react";
import { BrandLink } from "./brand-link";

export function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell app-shell--guest">
      <header className="app-header">
        <BrandLink />
        <nav aria-label="Guest navigation" className="app-header__actions">
          <a href="/login">Log in</a>
          <a className="app-link-button" href="/signup">
            Sign up
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}
