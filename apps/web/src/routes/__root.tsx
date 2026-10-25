import { useI18n } from "../shared/i18n";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ReceiptIcon, StorefrontIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import {
  CourierLayout,
  CustomerLayout,
  GuestLayout,
  OwnerLayout,
  getMealDeliRuntime,
} from "../app";
import { CartDrawer, cartCountAtom } from "../modules/checkout";
import { identityAtom, logoutLocallyFirst } from "../modules/identity";

function current(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

const RootLayout = () => {
  const { t, text } = useI18n();
  const runtime = getMealDeliRuntime();
  const identity = useAtomValue(identityAtom);
  const cartCount = useAtomValue(cartCountAtom);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [cartOpen, setCartOpen] = useState(false);
  const content = <Outlet />;
  const navigate = (to: string) => window.location.assign(to);
  const logout = () => {
    void logoutLocallyFirst(runtime.services.jotaiStore, runtime.identityRepository).finally(() =>
      navigate("/login"),
    );
  };

  if (identity.status !== "authenticated" || !identity.user) {
    return <GuestLayout>{text(content)}</GuestLayout>;
  }

  if (identity.user.role === "CUSTOMER") {
    return (
      <CustomerLayout
        cartCount={cartCount}
        navigation={[
          {
            label: t("common.restaurants"),
            href: "/restaurants",
            icon: StorefrontIcon,
            current: current(pathname, "/restaurants"),
          },
          {
            label: t("common.orders"),
            href: "/orders",
            icon: ReceiptIcon,
            current: current(pathname, "/orders"),
          },
          {
            label: t("common.profile"),
            href: "/profile",
            icon: UserCircleIcon,
            current: current(pathname, "/profile"),
          },
        ]}
        onCartOpen={() => setCartOpen(true)}
      >
        {text(content)}
        <CartDrawer
          onBrowseRestaurants={() => navigate("/restaurants")}
          onCheckout={() => navigate("/checkout")}
          onClose={() => setCartOpen(false)}
          open={cartOpen}
        />
      </CustomerLayout>
    );
  }

  if (identity.user.role === "OWNER") {
    return (
      <OwnerLayout
        navigation={[
          {
            label: t("common.dashboard"),
            href: "/dashboard",
            current: current(pathname, "/dashboard"),
          },
          {
            label: t("common.restaurants"),
            href: "/restaurants",
            current: current(pathname, "/restaurants"),
          },
          { label: t("common.orders"), href: "/orders", current: current(pathname, "/orders") },
          { label: t("common.profile"), href: "/profile", current: current(pathname, "/profile") },
        ]}
        onLogOut={logout}
        ownerName={identity.user.name}
      >
        {text(content)}
      </OwnerLayout>
    );
  }

  return (
    <CourierLayout
      navigation={[
        {
          label: t("common.dashboard"),
          href: "/dashboard",
          current: current(pathname, "/dashboard"),
        },
        { label: t("common.history"), href: "/orders", current: current(pathname, "/orders") },
        { label: t("common.profile"), href: "/profile", current: current(pathname, "/profile") },
      ]}
      onLogOut={logout}
    >
      {text(content)}
    </CourierLayout>
  );
};

export const Route = createRootRoute({ component: RootLayout });
