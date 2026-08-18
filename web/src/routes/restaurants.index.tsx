import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import { RequireAccess, getMealDeliRuntime } from "../app";
import {
  RestaurantDiscoveryPage,
  parseCatalogSearch,
  type CatalogSearch,
} from "../modules/catalog";
import { sessionUserAtom } from "../modules/identity";
import { OwnerRestaurantsPage } from "../modules/owner-management";

export const Route = createFileRoute("/restaurants/")({
  validateSearch: (search: Record<string, unknown>) =>
    parseCatalogSearch({
      query: typeof search.query === "string" ? search.query : undefined,
      category: typeof search.category === "string" ? search.category : undefined,
      page:
        typeof search.page === "string" || typeof search.page === "number"
          ? search.page
          : undefined,
    }),
  component: RestaurantsRoute,
});

function RestaurantsRoute() {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page =
    user?.role === "OWNER" ? (
      <OwnerRestaurantsPage
        navigate={(to) => window.location.assign(to)}
        repository={runtime.ownerRepository}
      />
    ) : (
      <RestaurantDiscoveryPage
        deliveryAddress={user?.address}
        onEditAddress={() => window.location.assign("/profile")}
        onSearchChange={(next: CatalogSearch) => void navigate({ search: next })}
        onViewRestaurant={(restaurantId) =>
          void navigate({ to: "/restaurants/$restaurantId", params: { restaurantId } })
        }
        repository={runtime.catalogRepository}
        search={search}
      />
    );
  return (
    <RequireAccess
      route={{
        requiresAuth: true,
        requiresVerification: true,
        allowedRoles: ["CUSTOMER", "OWNER"],
      }}
    >
      {page}
    </RequireAccess>
  );
}
