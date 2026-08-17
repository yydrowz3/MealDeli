import { OrderDetailPage, OrdersPage, type Order, type OrderConnectionState } from "../../orders";

export type CourierHistoryPageProps = Readonly<{
  orders: readonly Order[];
  onViewOrder: (order: Order) => void;
  onContinueDelivery: (order: Order) => void;
}>;

export function CourierHistoryPage({
  orders,
  onViewOrder,
  onContinueDelivery,
}: CourierHistoryPageProps) {
  return (
    <OrdersPage
      onViewOrder={onViewOrder}
      renderAction={(order) =>
        order.status === "PICKED" ? (
          <button onClick={() => onContinueDelivery(order)} type="button">Continue delivery</button>
        ) : null
      }
      role="COURIER"
      state={{ kind: "ready", orders }}
    />
  );
}

export type CourierCompletedDeliveryPageProps = Readonly<{
  order: Order | null;
  connectionState?: OrderConnectionState;
  onBack: () => void;
}>;

export function CourierCompletedDeliveryPage({
  order,
  connectionState,
  onBack,
}: CourierCompletedDeliveryPageProps) {
  return (
    <OrderDetailPage
      connectionState={connectionState}
      onBack={onBack}
      role="COURIER"
      state={order?.status === "DELIVERED" ? { kind: "ready", order } : { kind: "not-found" }}
    />
  );
}

