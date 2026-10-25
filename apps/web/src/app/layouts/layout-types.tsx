import { useI18n } from "../../shared/i18n";
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
  const { t, text, formatNumber } = useI18n();
  return (
    <>
      {items.map((item) => (
        <a
          aria-current={item.current ? "page" : undefined}
          className="inline-flex items-center gap-2"
          href={item.href}
          key={item.href}
        >
          {item.icon ? <item.icon aria-hidden="true" size={18} /> : null}
          {text(item.label)}
          {item.badge ? (
            <span aria-label={t("app.newCount", { count: item.badge })}>
              {formatNumber(item.badge)}
            </span>
          ) : null}
        </a>
      ))}
    </>
  );
}
