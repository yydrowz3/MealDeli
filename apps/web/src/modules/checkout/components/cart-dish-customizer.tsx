import { useI18n } from "../../../shared/i18n";
import { useStore } from "jotai";
import { useState } from "react";

import type { Dish } from "../../catalog";
import { Button, Modal } from "../../../shared/ui";
import { addCartLineAtom, replaceRestaurantCartAtom } from "../model/cart-atoms";
import type { CartLine, CartRestaurant } from "../model/types";
import { DishCustomizer } from "./dish-customizer";

export type CartDishCustomizerProps = {
  dish: Dish;
  restaurant: CartRestaurant;
  onAdded?: () => void;
  uuid?: () => string;
};

export function CartDishCustomizer({ dish, restaurant, onAdded, uuid }: CartDishCustomizerProps) {
  const { t } = useI18n();
  const store = useStore();
  const [pending, setPending] = useState<CartLine | null>(null);
  const [currentRestaurantName, setCurrentRestaurantName] = useState("");

  const add = (line: CartLine) => {
    const result = store.set(addCartLineAtom, { restaurant, line });
    if (result.kind === "REQUIRES_REPLACEMENT_CONFIRMATION") {
      setPending(line);
      setCurrentRestaurantName(result.currentRestaurant.name);
      return;
    }
    if (result.kind !== "QUANTITY_LIMIT") onAdded?.();
  };

  return (
    <>
      <DishCustomizer dish={dish} onAdd={add} uuid={uuid} />
      <Modal
        footer={
          <div className="flex items-center gap-3">
            <Button onClick={() => setPending(null)} variant="secondary">
              {t("checkout.keepCart")}
            </Button>
            <Button
              onClick={() => {
                if (!pending) return;
                store.set(replaceRestaurantCartAtom, { restaurant, line: pending });
                setPending(null);
                onAdded?.();
              }}
            >
              {t("checkout.newCart")}
            </Button>
          </div>
        }
        onClose={() => setPending(null)}
        open={pending !== null}
        title={t("checkout.confirmNewCart")}
      >
        <p>{t("checkout.replaceCart", { restaurant: currentRestaurantName })}</p>
      </Modal>
    </>
  );
}
