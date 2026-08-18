import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "CUSTOMER" as "CUSTOMER" | "OWNER" | "COURIER",
  authenticated: true,
  pathname: "/",
  search: {} as Record<string, unknown>,
  params: { restaurantId: "restaurant-1", orderId: "order-1" },
  navigate: vi.fn(),
  ownerList: vi.fn(),
  orderList: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  const makeRoute = (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => state.search,
    useParams: () => state.params,
    useNavigate: () => state.navigate,
  });
  return {
    createFileRoute: () => (options: Record<string, unknown>) => makeRoute(options),
    createRootRoute: (options: Record<string, unknown>) => makeRoute(options),
    Outlet: () => React.createElement("div", { "data-testid": "outlet" }),
    useRouterState: ({ select }: { select(value: unknown): unknown }) =>
      select({ location: { pathname: state.pathname } }),
  };
});

vi.mock("jotai", () => ({
  useAtomValue: (key: string) => {
    if (key === "identity") {
      return state.authenticated
        ? {
            status: "authenticated",
            user: {
              id: "user-1",
              name: "Meal User",
              role: state.role,
              verifiedAt: "2026-08-17T00:00:00.000Z",
              address: "1 Jade Way",
            },
          }
        : { status: "anonymous", user: null };
    }
    if (key === "session") {
      return state.authenticated
        ? {
            id: "user-1",
            name: "Meal User",
            role: state.role,
            verifiedAt: "2026-08-17T00:00:00.000Z",
            address: "1 Jade Way",
          }
        : null;
    }
    if (key === "selected") return null;
    return 2;
  },
  useSetAtom: () => vi.fn(),
}));

const runtime = vi.hoisted(() => ({
  services: { jotaiStore: {} },
  identityRepository: {},
  catalogRepository: {
    getRestaurant: vi.fn().mockResolvedValue({ name: "Jade Kitchen" }),
  },
  orderRepository: { list: state.orderList, get: vi.fn(), updateStatus: vi.fn() },
  orderCommandRepository: {},
  ownerRepository: { list: state.ownerList },
  courierRepository: {},
  orderSubscriptions: {},
  mediaUploader: {},
  promotionRepository: {},
  reconcileOrder: vi.fn(),
}));

vi.mock("../app", async () => {
  const React = await import("react");
  const shell = (name: string) => (props: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": name }, props.children);
  return {
    getMealDeliRuntime: () => runtime,
    RequireAccess: shell("access"),
    LandingPage: () => React.createElement("main", null, "landing"),
    GuestLayout: shell("guest-layout"),
    CustomerLayout: (props: { children: React.ReactNode; onCartOpen(): void }) =>
      React.createElement(
        "div",
        { "data-testid": "customer-layout" },
        props.children,
        React.createElement("button", { onClick: props.onCartOpen }, "open cart"),
      ),
    OwnerLayout: shell("owner-layout"),
    CourierLayout: shell("courier-layout"),
  };
});

vi.mock("../app/composition/order-route-content", async () => {
  const React = await import("react");
  return {
    CheckoutRouteContent: () => React.createElement("div", null, "checkout content"),
    OrdersRouteContent: () => React.createElement("div", null, "orders content"),
    OrderDetailRouteContent: ({ orderId }: { orderId: string }) =>
      React.createElement("div", null, `order detail ${orderId}`),
  };
});

vi.mock("../modules/checkout", async () => {
  const React = await import("react");
  return {
    cartCountAtom: "cart-count",
    CartDrawer: (props: { open: boolean }) =>
      React.createElement("div", { "data-open": props.open, "data-testid": "cart-drawer" }),
    CartDishCustomizer: ({ dish }: { dish: { name: string } }) =>
      React.createElement("div", null, `customize ${dish.name}`),
  };
});

vi.mock("../modules/identity", async () => {
  const React = await import("react");
  const page = (label: string) => (props: { navigate?(to: string): void }) =>
    React.createElement(
      "button",
      { onClick: () => props.navigate?.("/dashboard") },
      label,
    );
  return {
    identityAtom: "identity",
    sessionUserAtom: "session",
    logoutLocallyFirst: vi.fn().mockResolvedValue(undefined),
    parseSignupRole: (role: unknown) =>
      role === "CUSTOMER" || role === "OWNER" || role === "COURIER" ? role : null,
    LoginPage: page("login page"),
    SignupPage: page("signup page"),
    VerifyEmailPage: page("verify page"),
    ProfilePage: page("profile page"),
  };
});

vi.mock("../modules/catalog", async () => {
  const React = await import("react");
  return {
    parseCatalogSearch: (search: Record<string, unknown>) => ({ page: Number(search.page) || 1 }),
    RestaurantDiscoveryPage: (props: {
      onSearchChange(value: { page: number }): void;
      onViewRestaurant(id: string): void;
      onEditAddress(): void;
    }) =>
      React.createElement(
        "div",
        null,
        "discovery page",
        React.createElement("button", { onClick: () => props.onSearchChange({ page: 2 }) }, "search"),
        React.createElement("button", { onClick: () => props.onViewRestaurant("restaurant-2") }, "view restaurant"),
        React.createElement("button", { onClick: props.onEditAddress }, "edit address"),
      ),
    RestaurantMenuPage: (props: { onSelectDish(dish: { name: string }): void }) =>
      React.createElement(
        "button",
        { onClick: () => props.onSelectDish({ name: "Soup" }) },
        "menu page",
      ),
  };
});

vi.mock("../modules/owner-management", async () => {
  const React = await import("react");
  const page = (label: string) => () => React.createElement("div", null, label);
  return {
    selectedOwnerRestaurantIdAtom: "selected",
    setSelectedOwnerRestaurantAtom: "set-selected",
    NewOrderNotifier: () => React.createElement("div", null, "new order notifier"),
    OwnerOrdersAction: page("owner action"),
    OwnerRestaurantsPage: page("owner restaurants"),
    OwnerCreateRestaurantPage: page("new restaurant"),
    OwnerRestaurantOverviewPage: page("owner overview"),
    OwnerMenuPage: page("owner menu"),
    OwnerRestaurantSettingsPage: page("owner settings"),
  };
});

vi.mock("../modules/owner-insights", async () => {
  const React = await import("react");
  return {
    OwnerDashboardPage: () => React.createElement("div", null, "owner dashboard"),
    PromotionPage: () => React.createElement("div", null, "promotion page"),
  };
});

vi.mock("../modules/courier", async () => {
  const React = await import("react");
  return {
    CourierDashboardPage: () => React.createElement("div", null, "courier dashboard"),
    DeliveryPage: () => React.createElement("div", null, "delivery page"),
  };
});

vi.mock("../shared/ui", async () => {
  const React = await import("react");
  return {
    Modal: (props: { open: boolean; children: React.ReactNode }) =>
      props.open ? React.createElement("div", null, props.children) : null,
    ErrorState: () => React.createElement("div", null, "error state"),
    Skeleton: () => React.createElement("div", null, "loading"),
  };
});

type FakeRoute = {
  component: React.ComponentType;
  validateSearch?: (search: Record<string, unknown>) => unknown;
};
const routeModules: Record<string, FakeRoute> = {};

beforeAll(async () => {
  const modules = await Promise.all([
    import("./index"),
    import("./login"),
    import("./signup"),
    import("./verify-email"),
    import("./profile"),
    import("./restaurants.index"),
    import("./restaurants.new"),
    import("./restaurants.$restaurantId.index"),
    import("./restaurants.$restaurantId.menu"),
    import("./restaurants.$restaurantId.settings"),
    import("./restaurants.$restaurantId.promotion"),
    import("./checkout"),
    import("./orders.index"),
    import("./orders.$orderId"),
    import("./deliveries.$orderId"),
    import("./dashboard"),
    import("./__root"),
  ]);
  const names = [
    "index", "login", "signup", "verify", "profile", "restaurants", "new", "restaurant",
    "menu", "settings", "promotion", "checkout", "orders", "order", "delivery", "dashboard", "root",
  ];
  modules.forEach((module, index) => {
    routeModules[names[index]] = module.Route as unknown as FakeRoute;
  });
});

function renderRoute(name: string) {
  const Component = routeModules[name].component;
  return render(<Component />);
}

describe("shared route composition", () => {
  beforeEach(() => {
    state.role = "CUSTOMER";
    state.authenticated = true;
    state.search = {};
    state.pathname = "/";
    state.navigate.mockReset();
    state.ownerList.mockReset().mockResolvedValue([]);
    state.orderList.mockReset().mockResolvedValue([]);
    runtime.catalogRepository.getRestaurant.mockReset().mockResolvedValue({
      name: "Jade Kitchen",
    });
  });

  it("renders landing and identity/profile entries", async () => {
    renderRoute("index");
    expect(screen.getByText("landing")).toBeInTheDocument();
    for (const name of ["login", "signup", "verify", "profile"]) {
      renderRoute(name);
    }
    expect(document.body).toHaveTextContent("signup page");
    expect(document.body).toHaveTextContent("verify page");
    expect(document.body).toHaveTextContent("profile page");
    expect(routeModules.login.validateSearch?.({ returnTo: "/orders" })).toEqual({
      returnTo: "/orders",
    });
    expect(routeModules.login.validateSearch?.({ returnTo: 7 })).toEqual({ returnTo: undefined });
    expect(routeModules.signup.validateSearch?.({ role: "OWNER" })).toEqual({ role: "OWNER" });
    expect(routeModules.signup.validateSearch?.({ role: null })).toEqual({ role: undefined });
    expect(routeModules.verify.validateSearch?.({ token: "token" })).toEqual({ token: "token" });
    expect(routeModules.verify.validateSearch?.({ token: false })).toEqual({ token: undefined });
  });

  it("dispatches restaurant routes between Customer and Owner", async () => {
    const user = userEvent.setup();
    renderRoute("restaurants");
    expect(screen.getByText("discovery page")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "search" }));
    await user.click(screen.getByRole("button", { name: "view restaurant" }));

    renderRoute("restaurant");
    await user.click(screen.getByRole("button", { name: "menu page" }));
    await screen.findByText("customize Soup");

    state.role = "OWNER";
    renderRoute("restaurants");
    renderRoute("restaurant");
    renderRoute("new");
    renderRoute("menu");
    renderRoute("settings");
    renderRoute("promotion");
    expect(document.body).toHaveTextContent("owner restaurants");
    expect(document.body).toHaveTextContent("owner overview");
    expect(document.body).toHaveTextContent("promotion page");
    expect(
      routeModules.restaurants.validateSearch?.({ query: "soup", category: 9, page: "2" }),
    ).toEqual({ page: 2 });
    expect(
      routeModules.restaurants.validateSearch?.({ query: null, category: "korean", page: 3 }),
    ).toEqual({ page: 3 });
    expect(routeModules.restaurants.validateSearch?.({ page: false })).toEqual({ page: 1 });
  });

  it("registers checkout, orders, delivery, and both dashboard roles", async () => {
    renderRoute("checkout");
    renderRoute("orders");
    renderRoute("order");
    renderRoute("delivery");
    state.role = "COURIER";
    renderRoute("dashboard");
    expect(document.body).toHaveTextContent("courier dashboard");

    state.role = "OWNER";
    renderRoute("dashboard");
    await waitFor(() => expect(screen.getByText("owner dashboard")).toBeInTheDocument());
    expect(document.body).toHaveTextContent("checkout content");
    expect(document.body).toHaveTextContent("order detail order-1");
    expect(document.body).toHaveTextContent("delivery page");
  });

  it("selects Guest, Customer, Owner, and Courier shells", async () => {
    const user = userEvent.setup();
    state.authenticated = false;
    const guest = renderRoute("root");
    expect(screen.getByTestId("guest-layout")).toBeInTheDocument();
    guest.unmount();

    state.authenticated = true;
    state.role = "CUSTOMER";
    const customer = renderRoute("root");
    await user.click(screen.getByRole("button", { name: "open cart" }));
    expect(screen.getByTestId("cart-drawer")).toHaveAttribute("data-open", "true");
    customer.unmount();

    state.role = "OWNER";
    const owner = renderRoute("root");
    expect(screen.getByTestId("owner-layout")).toBeInTheDocument();
    owner.unmount();

    state.role = "COURIER";
    renderRoute("root");
    expect(screen.getByTestId("courier-layout")).toBeInTheDocument();
  });
});
