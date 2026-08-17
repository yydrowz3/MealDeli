import type { ReactNode } from "react";

export type NavigationItem = {
  label: string;
  href: string;
  current?: boolean;
  badge?: number;
};

export type LayoutProps = {
  children: ReactNode;
  navigation: readonly NavigationItem[];
};

export function NavigationLinks({ items }: { items: readonly NavigationItem[] }) {
  return (
    <>
      {items.map((item) => (
        <a aria-current={item.current ? "page" : undefined} href={item.href} key={item.href}>
          {item.label}
          {item.badge ? <span aria-label={`${item.badge} new`}>{item.badge}</span> : null}
        </a>
      ))}
    </>
  );
}
