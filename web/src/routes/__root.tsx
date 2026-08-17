import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
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
    return <GuestLayout>{content}</GuestLayout>;
  }

  if (identity.user.role === "CUSTOMER") {
    return (
      <CustomerLayout
        cartCount={cartCount}
        navigation={[
          { label: "Restaurants", href: "/restaurants", current: current(pathname, "/restaurants") },
          { label: "Orders", href: "/orders", current: current(pathname, "/orders") },
          { label: "Profile", href: "/profile", current: current(pathname, "/profile") },
        ]}
        onCartOpen={() => setCartOpen(true)}
      >
        {content}
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
          { label: "Dashboard", href: "/dashboard", current: current(pathname, "/dashboard") },
          { label: "Restaurants", href: "/restaurants", current: current(pathname, "/restaurants") },
          { label: "Orders", href: "/orders", current: current(pathname, "/orders") },
          { label: "Profile", href: "/profile", current: current(pathname, "/profile") },
        ]}
        onLogOut={logout}
        ownerName={identity.user.name}
      >
        {content}
      </OwnerLayout>
    );
  }

  return (
    <CourierLayout
      navigation={[
        { label: "Dashboard", href: "/dashboard", current: current(pathname, "/dashboard") },
        { label: "History", href: "/orders", current: current(pathname, "/orders") },
        { label: "Profile", href: "/profile", current: current(pathname, "/profile") },
      ]}
      onLogOut={logout}
    >
      {content}
    </CourierLayout>
  );
};

export const Route = createRootRoute({ component: RootLayout });
