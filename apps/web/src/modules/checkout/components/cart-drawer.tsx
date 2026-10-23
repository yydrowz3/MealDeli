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
            <Button
              className="checkout-drawer-checkout-button"
              disabled={locked}
              onClick={onCheckout}
              size="sm"
            >
              Go to checkout
              <ArrowRightIcon aria-hidden="true" size={18} />
            </Button>
          ) : undefined
        }
        onClose={onClose}
        open={open}
        title={cart.restaurant?.name ?? "Your cart"}
      >
        {cart.lines.length === 0 ? (
          <EmptyState
            action={{ label: "Browse restaurants", onClick: onBrowseRestaurants }}
            description="Add a dish to get started."
            title="Your cart is empty"
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
            <p>Delivery is free in this demo.</p>
          </>
        )}
      </Drawer>
      <Modal
        footer={
          <div className="checkout-dialog-actions">
            <Button onClick={() => setPendingRemoval(null)} variant="secondary">
              Keep item
            </Button>
            <Button
              onClick={() => {
                if (pendingRemoval) remove(pendingRemoval);
                setPendingRemoval(null);
              }}
              variant="danger"
            >
              <TrashIcon aria-hidden="true" size={18} />
              Remove item
            </Button>
          </div>
        }
        onClose={() => setPendingRemoval(null)}
        open={pendingRemoval !== null}
        title="Remove item?"
      >
        <p>Remove this item from your cart?</p>
      </Modal>
    </>
  );
}
