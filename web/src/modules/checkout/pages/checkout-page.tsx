import { useAtomValue, useStore } from "jotai";
import { useMemo, useState } from "react";

import type { IdentityRepository, JotaiStore } from "../../identity";
import { Button, Card, EmptyState, ErrorState, toastAdapter } from "../../../shared/ui";
import { AddressEditor } from "../components/address-editor";
import { CartSummary } from "../components/cart-summary";
import { cartAtom, removeCartLineAtom } from "../model/cart-atoms";
import type { CheckoutLoadResult } from "../model/checkout-loader";
import { createCheckoutCoordinator } from "../model/order-command";
import type { CreateOrderPayload, OrderCommandRepository } from "../model/types";

export type CheckoutPageProps = {
  state: CheckoutLoadResult;
  identityRepository: IdentityRepository;
  orderRepository: OrderCommandRepository;
  reconcileOrder: (payload: CreateOrderPayload, submittedAt: number) => Promise<string | null>;
  onBrowseRestaurants: () => void;
  onOrderCreated: (orderId: string) => void | Promise<void>;
  store?: JotaiStore;
};

export function CheckoutPage({
  state,
  identityRepository,
  orderRepository,
  reconcileOrder,
  onBrowseRestaurants,
  onOrderCreated,
  store: injectedStore,
}: CheckoutPageProps) {
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const cart = useAtomValue(cartAtom, { store });
  const [address, setAddress] = useState(state.kind === "ready" ? state.address : null);
  const [editingAddress, setEditingAddress] = useState(!address);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const coordinator = useMemo(
    () =>
      createCheckoutCoordinator({
        store,
        repository: orderRepository,
        reconcile: reconcileOrder,
        onOrderCreated,
      }),
    [onOrderCreated, orderRepository, reconcileOrder, store],
  );

  if (state.kind === "forbidden") {
    return <ErrorState description="Customer access is required." title="Checkout unavailable" />;
  }
  if (state.kind === "verification-required") {
    return (
      <ErrorState
        description="Verify your email before placing an order."
        title="Verification required"
      />
    );
  }
  if (state.kind === "empty" || cart.lines.length === 0) {
    return (
      <EmptyState
        action={{ label: "Browse restaurants", onClick: onBrowseRestaurants }}
        description="Add a dish before checking out."
        title="Your cart is empty"
      />
    );
  }
  if (state.kind === "restaurant-missing") {
    return (
      <ErrorState
        description="Return to restaurants to start a new cart."
        title="This restaurant is no longer available."
      />
    );
  }
  if (state.kind === "error") {
    return <ErrorState description={state.message} title="Checkout unavailable" />;
  }

  const invalidLineIds = new Set(state.invalidLines.map((line) => line.lineId));
  const hasInvalidLines = cart.lines.some((line) => invalidLineIds.has(line.lineId));
  const addressValid = Boolean(address?.trim());

  const placeOrder = async () => {
    if (submitting || !addressValid || hasInvalidLines) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await coordinator.submit();
    if (result.kind === "success") {
      toastAdapter.success("Order placed.");
    } else if (result.kind === "timeout-unresolved") {
      setSubmitError(
        "We couldn’t confirm whether your order was placed. Check your orders before trying again.",
      );
    } else if (result.kind === "error") {
      setSubmitError("We couldn’t place your order. Try again.");
    } else if (result.kind === "cart-changed") {
      setSubmitError(
        "Your cart changed while the order was being placed. Review it before continuing.",
      );
    }
    setSubmitting(false);
  };

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>
      {hasInvalidLines ? <p role="alert">Some items are no longer available.</p> : null}
      <div className="checkout-page__grid">
        <div className="checkout-page__details">
          <Card>
            <h2>Delivery address</h2>
            {!editingAddress && address ? (
              <>
                <p>{address}</p>
                <Button
                  disabled={submitting}
                  onClick={() => setEditingAddress(true)}
                  variant="secondary"
                >
                  Edit
                </Button>
              </>
            ) : (
              <AddressEditor
                onSaved={(nextAddress) => {
                  setAddress(nextAddress);
                  setEditingAddress(false);
                }}
                repository={identityRepository}
                store={store}
              />
            )}
            {!addressValid ? <p>Add a delivery address to continue.</p> : null}
          </Card>
          <Card>
            <h2>Payment</h2>
            <h3>Demo payment</h3>
            <p>No card is required. Your order will be placed immediately.</p>
          </Card>
        </div>
        <Card className="checkout-page__summary">
          <h2>Order summary</h2>
          <CartSummary
            cart={cart}
            disabled={submitting}
            invalidLineIds={invalidLineIds}
            onRemove={(lineId) => store.set(removeCartLineAtom, lineId)}
          />
          <p>No delivery fee in this demo.</p>
          {submitError ? <p role="alert">{submitError}</p> : null}
          <Button
            className="mt-4"
            disabled={!addressValid || hasInvalidLines}
            loading={submitting}
            onClick={() => void placeOrder()}
            size="lg"
          >
            Pay &amp; place order
          </Button>
        </Card>
      </div>
    </main>
  );
}
