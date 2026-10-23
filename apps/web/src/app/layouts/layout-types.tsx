import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type NavigationIcon = ComponentType<IconProps>;

export type NavigationItem = {
  label: string;
  href: string;
  current?: boolean;
  badge?: number;
  icon?: NavigationIcon;
};

export type LayoutProps = {
  children: ReactNode;
  navigation: readonly NavigationItem[];
};

export function NavigationLinks({ items }: { items: readonly NavigationItem[] }) {
  return (
    <>
      {items.map((item) => (
        <a
          aria-current={item.current ? "page" : undefined}
          className="app-nav-link"
          href={item.href}
          key={item.href}
        >
          {item.icon ? <item.icon aria-hidden="true" size={18} /> : null}
          {item.label}
          {item.badge ? <span aria-label={`${item.badge} new`}>{item.badge}</span> : null}
        </a>
      ))}
    </>
  );
}
