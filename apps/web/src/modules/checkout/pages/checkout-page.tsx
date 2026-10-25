import { errorMessage, message as localizedMessage, useI18n } from "../../../shared/i18n";
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
  const { t, text } = useI18n();
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
    return (
      <ErrorState description={t("checkout.customerRequired")} title={t("checkout.unavailable")} />
    );
  }
  if (state.kind === "verification-required") {
    return (
      <ErrorState
        description={t("checkout.verifyEmail")}
        title={t("checkout.verificationRequired")}
      />
    );
  }
  if (state.kind === "empty" || cart.lines.length === 0) {
    return (
      <EmptyState
        action={{ label: t("checkout.browse"), onClick: onBrowseRestaurants }}
        description={t("checkout.addBeforeCheckout")}
        title={t("checkout.emptyCart")}
      />
    );
  }
  if (state.kind === "restaurant-missing") {
    return (
      <ErrorState
        description={t("checkout.restartCart")}
        title={t("checkout.restaurantUnavailable")}
      />
    );
  }
  if (state.kind === "error") {
    return (
      <ErrorState
        description={text(errorMessage(state.message, "checkout.loadFailed"))}
        title={t("checkout.unavailable")}
      />
    );
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
      toastAdapter.success(t("checkout.orderPlaced"));
    } else if (result.kind === "timeout-unresolved") {
      setSubmitError(localizedMessage("checkout.checkOrders"));
    } else if (result.kind === "error") {
      setSubmitError(localizedMessage("checkout.placeFailed"));
    } else if (result.kind === "cart-changed") {
      setSubmitError(localizedMessage("checkout.cartChanged"));
    }
    setSubmitting(false);
  };

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <h1>{t("checkout.title")}</h1>
      {hasInvalidLines ? <p role="alert">{t("checkout.unavailableItems")}</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <Card>
            <h2>{t("common.deliveryAddress")}</h2>
            {!editingAddress && address ? (
              <>
                <p>{text(address)}</p>
                <Button
                  disabled={submitting}
                  onClick={() => setEditingAddress(true)}
                  variant="secondary"
                >
                  {t("common.edit")}
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
            {!addressValid ? <p>{t("checkout.addressRequired")}</p> : null}
          </Card>
          <Card>
            <h2>{t("common.payment")}</h2>
            <h3>{t("common.demoPayment")}</h3>
            <p>{t("checkout.paymentHelp")}</p>
          </Card>
        </div>
        <Card className="self-start lg:sticky lg:top-4">
          <h2>{t("common.orderSummary")}</h2>
          <CartSummary
            cart={cart}
            disabled={submitting}
            invalidLineIds={invalidLineIds}
            onRemove={(lineId) => store.set(removeCartLineAtom, lineId)}
          />
          <p>{t("checkout.noDeliveryFee")}</p>
          {submitError ? <p role="alert">{text(submitError)}</p> : null}
          <Button
            className="mt-4"
            disabled={!addressValid || hasInvalidLines}
            loading={submitting}
            onClick={() => void placeOrder()}
            size="lg"
          >
            {t("checkout.pay")}
          </Button>
        </Card>
      </div>
    </main>
  );
}
