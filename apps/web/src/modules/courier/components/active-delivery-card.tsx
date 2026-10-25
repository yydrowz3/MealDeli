import { useI18n } from "../../../shared/i18n";
import { Button, Card, DateTime, Money, StatusBadge } from "../../../shared/ui";
import type { Order } from "../../orders";

export type ActiveDeliveryCardProps = Readonly<{
  order: Order;
  onContinue: (order: Order) => void;
}>;

export function ActiveDeliveryCard({ order, onContinue }: ActiveDeliveryCardProps) {
  const { t, text } = useI18n();
  return (
    <Card className="grid gap-4 mt-6 mx-0 mb-10">
      <div>
        <p className="text-jade-text text-[0.82rem] font-bold tracking-[0.08em] uppercase">
          {t("courier.activeDelivery")}
        </p>
        <h2>{text(order.restaurant?.name ?? t("common.restaurantUnavailable"))}</h2>
        {order.restaurant ? <p>{text(order.restaurant.address)}</p> : null}
      </div>
      <StatusBadge status="PICKED" />
      <dl className="grid grid-cols-2 gap-3 m-0">
        <div className="grid gap-1">
          <dt className="text-muted text-[0.875rem]">{t("common.orderTotal")}</dt>
          <dd className="m-0 font-[650]">
            <Money minor={order.totalMinor} />
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted text-[0.875rem]">{t("courier.accepted")}</dt>
          <dd className="m-0 font-[650]">
            <DateTime value={order.updatedAt} />
          </dd>
        </div>
      </dl>
      <Button onClick={() => onContinue(order)}>{t("courier.continueDelivery")}</Button>
    </Card>
  );
}
