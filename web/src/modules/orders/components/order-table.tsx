import type { ReactNode } from "react";

import { Button, DateTime, Money } from "../../../shared/ui";

import type { Order } from "../model/types";
import { OrderStatusBadge } from "./order-status-badge";

export type OrderTableProps = Readonly<{
  orders: readonly Order[];
  onView?: (order: Order) => void;
  renderAction?: (order: Order) => ReactNode;
}>;

export function OrderTable({ orders, onView, renderAction }: OrderTableProps) {
  return (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Restaurant</th>
            <th>Placed</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id.slice(0, 8)}</td>
              <td>{order.restaurant?.name ?? "Restaurant unavailable"}</td>
              <td><DateTime value={order.createdAt} /></td>
              <td><OrderStatusBadge status={order.status} /></td>
              <td>{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
              <td><Money minor={order.totalMinor} /></td>
              <td>
                {renderAction?.(order) ??
                  (onView ? <Button onClick={() => onView(order)} size="sm" variant="secondary">View order</Button> : null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
