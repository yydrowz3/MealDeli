import type { ReactNode } from "react";
import { BrandLink } from "./brand-link";

export function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-solid border-b-border bg-[color-mix(in_srgb,var(--color-warm-white)_94%,transparent)] py-3 px-[max(var(--space-4),calc((100vw-var(--content-max-width))/2))] min-h-18 [@media(max-width:39.999rem)]:min-h-16">
        <BrandLink />
        <nav
          aria-label="Guest navigation"
          className="flex items-center gap-6 [&_a]:font-[650] [&_a]:no-underline"
        >
          <a href="/login">Log in</a>
          <a
            className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-solid border-transparent bg-jade px-6 py-0 text-charcoal no-underline hover:bg-jade-dark hover:text-surface font-[650] [@media(max-width:39.999rem)]:hidden"
            href="/signup"
          >
            Sign up
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}
