import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { RestaurantMenuPage, type Dish } from "../modules/catalog";
import { CartDishCustomizer } from "../modules/checkout";
import { sessionUserAtom } from "../modules/identity";
import { OwnerRestaurantOverviewPage } from "../modules/owner-management";
import { Modal } from "../shared/ui";

export const Route = createFileRoute("/restaurants/$restaurantId/")({
  component: RestaurantRoute,
});

function RestaurantRoute() {
  const { restaurantId } = Route.useParams();
  const user = useAtomValue(sessionUserAtom);
  const runtime = getMealDeliRuntime();
  const [selection, setSelection] = useState<Readonly<{
    dish: Dish;
    restaurantName: string;
  }> | null>(null);

  const page =
    user?.role === "OWNER" ? (
      <OwnerRestaurantOverviewPage
        navigate={(to) => window.location.assign(to)}
        orderRepository={runtime.orderRepository}
        repository={runtime.ownerRepository}
        restaurantId={restaurantId}
      />
    ) : (
      <>
        <RestaurantMenuPage
          onBack={() => window.location.assign("/restaurants")}
          onSelectDish={(dish) => {
            void runtime.catalogRepository
              .getRestaurant(restaurantId)
              .then((restaurant) =>
                setSelection({ dish, restaurantName: restaurant?.name ?? "Restaurant" }),
              );
          }}
          repository={runtime.catalogRepository}
          restaurantId={restaurantId}
        />
        <Modal
          onClose={() => setSelection(null)}
          open={selection !== null}
          title={selection?.dish.name ?? "Customize dish"}
        >
          {selection ? (
            <CartDishCustomizer
              dish={selection.dish}
              onAdded={() => setSelection(null)}
              restaurant={{ id: restaurantId, name: selection.restaurantName }}
            />
          ) : null}
        </Modal>
      </>
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
