import { useI18n } from "../../../shared/i18n";
import type { ReactNode } from "react";

import { Button, DateTime, Money } from "../../../shared/ui";

import type { Order } from "../model/types";
import { OrderStatusBadge } from "./order-status-badge";

export type OrderTableProps = Readonly<{
  orders: readonly Order[];
  onView?: (order: Order) => void;
  renderAction?: (order: Order) => ReactNode;
}>;

const headerCellClasses = "border-b border-solid border-b-border p-3 text-left";
const cellClasses =
  "border-b border-solid border-b-border p-3 text-left [@media(max-width:47.99rem)]:block [@media(max-width:47.99rem)]:border-0 [@media(max-width:47.99rem)]:border-none [@media(max-width:47.99rem)]:border-current [@media(max-width:47.99rem)]:px-0 [@media(max-width:47.99rem)]:py-2";
const rowClasses =
  "[@media(max-width:47.99rem)]:block [@media(max-width:47.99rem)]:mb-4 [@media(max-width:47.99rem)]:rounded-card [@media(max-width:47.99rem)]:border [@media(max-width:47.99rem)]:border-solid [@media(max-width:47.99rem)]:border-border [@media(max-width:47.99rem)]:p-4";

export function OrderTable({ orders, onView, renderAction }: OrderTableProps) {
  const { t, text } = useI18n();
  return (
    <div className="overflow-x-auto [@media(max-width:47.99rem)]:overflow-visible">
      <table className="w-full border-collapse [@media(max-width:47.99rem)]:block">
        <thead className="[@media(max-width:47.99rem)]:hidden">
          <tr className={rowClasses}>
            <th className={headerCellClasses}>{t("orders.order")}</th>
            <th className={headerCellClasses}>{t("common.restaurant")}</th>
            <th className={headerCellClasses}>{t("orders.placed")}</th>
            <th className={headerCellClasses}>{t("orders.status")}</th>
            <th className={headerCellClasses}>{t("common.items")}</th>
            <th className={headerCellClasses}>{t("common.total")}</th>
            <th className={headerCellClasses}>{t("orders.action")}</th>
          </tr>
        </thead>
        <tbody className="[@media(max-width:47.99rem)]:block">
          {orders.map((order) => (
            <tr className={rowClasses} key={order.id}>
              <td className={cellClasses}>#{text(order.id.slice(0, 8))}</td>
              <td className={cellClasses}>
                {text(order.restaurant?.name ?? t("common.restaurantUnavailable"))}
              </td>
              <td className={cellClasses}>
                <DateTime value={order.createdAt} />
              </td>
              <td className={cellClasses}>
                <OrderStatusBadge status={order.status} />
              </td>
              <td className={cellClasses}>
                {order.items.reduce((total, item) => total + item.quantity, 0)}
              </td>
              <td className={cellClasses}>
                <Money minor={order.totalMinor} />
              </td>
              <td className={cellClasses}>
                {renderAction?.(order) ??
                  (onView ? (
                    <Button onClick={() => onView(order)} size="sm" variant="secondary">
                      {t("common.viewOrder")}
                    </Button>
                  ) : null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
