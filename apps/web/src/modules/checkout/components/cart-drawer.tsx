import { useI18n } from "../../../shared/i18n";
import { ArrowRightIcon, TrashIcon } from "@phosphor-icons/react";
import { useAtomValue, useStore } from "jotai";
import { useState } from "react";

import type { JotaiStore } from "../../identity";
import { Button, Drawer, EmptyState, Modal } from "../../../shared/ui";
import { cartAtom, changeCartQuantityAtom, removeCartLineAtom } from "../model/cart-atoms";
import { CartSummary } from "./cart-summary";

export type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onBrowseRestaurants: () => void;
  onCheckout: () => void;
  store?: JotaiStore;
  locked?: boolean;
};

export function CartDrawer({
  open,
  onClose,
  onBrowseRestaurants,
  onCheckout,
  store: injectedStore,
  locked = false,
}: CartDrawerProps) {
  const { t, text } = useI18n();
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const cart = useAtomValue(cartAtom, { store });
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const remove = (lineId: string) => store.set(removeCartLineAtom, lineId);

  return (
    <>
      <Drawer
        dismissible={!locked}
        footer={
          cart.lines.length > 0 ? (
            <Button disabled={locked} onClick={onCheckout} size="sm">
              {t("checkout.goToCheckout")}
              <ArrowRightIcon aria-hidden="true" size={18} />
            </Button>
          ) : undefined
        }
        onClose={onClose}
        open={open}
        title={text(cart.restaurant?.name ?? t("checkout.cart"))}
      >
        {cart.lines.length === 0 ? (
          <EmptyState
            action={{ label: t("checkout.browse"), onClick: onBrowseRestaurants }}
            description={t("checkout.addDishHint")}
            title={t("checkout.emptyCart")}
          />
        ) : (
          <>
            <CartSummary
              cart={cart}
              disabled={locked}
              onChangeQuantity={(lineId, quantity) => {
                if (quantity < 1) setPendingRemoval(lineId);
                else store.set(changeCartQuantityAtom, { lineId, quantity });
              }}
              onRemove={remove}
            />
            <p>{t("checkout.freeDelivery")}</p>
          </>
        )}
      </Drawer>
      <Modal
        footer={
          <div className="flex items-center gap-3">
            <Button onClick={() => setPendingRemoval(null)} variant="secondary">
              {t("checkout.keepItem")}
            </Button>
            <Button
              onClick={() => {
                if (pendingRemoval) remove(pendingRemoval);
                setPendingRemoval(null);
              }}
              variant="danger"
            >
              <TrashIcon aria-hidden="true" size={18} />
              {t("checkout.removeItem")}
            </Button>
          </div>
        }
        onClose={() => setPendingRemoval(null)}
        open={pendingRemoval !== null}
        title={t("checkout.confirmRemoveItem")}
      >
        <p>{t("checkout.removeItemHelp")}</p>
      </Modal>
    </>
  );
}
