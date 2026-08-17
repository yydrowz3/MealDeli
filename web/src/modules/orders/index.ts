import "./orders.css";

export type {
  Order,
  OrderDetailResult,
  OrderItem,
  OrderItemOption,
  OrderItemOptionChoice,
  OrderRealtimeEvent,
  OrderRole,
  OrderStatus,
  RestaurantSummary,
} from "./model/types";
export {
  ORDER_STATUSES,
} from "./model/types";
export {
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  buildOrderTimeline,
  canRoleTransitionOrder,
  getNextOrderStatus,
  getOrderStatusRank,
  isAdjacentOrderTransition,
} from "./model/status-machine";
export { projectOrdersForRole, sortOrdersNewestFirst } from "./model/role-projection";
export type { OrderSection, OwnerOrderFilters } from "./model/role-projection";
export { createCustomerOrderStatusNotifier } from "./model/customer-notifier";
export type { CustomerOrderNotification } from "./model/customer-notifier";

export { createOrderRepository, OrderRepositoryError } from "./api/order-repository";
export type {
  OrderGraphqlTransport,
  OrderRepository,
} from "./api/order-repository";
export {
  mergeApolloOrderEvent,
  mergeOrderEvent,
  mergeOrderEventIntoList,
  replaceApolloOrderAuthoritatively,
} from "./api/cache-updates";
export type {
  ApolloOrderCachePort,
  OrderMergeReason,
  OrderMergeResult,
} from "./api/cache-updates";
export {
  createOrderRealtimeAdapter,
  createOrderSubscriptionPort,
  createOwnerPendingRealtimeAdapter,
  createRealtimeSubscription,
} from "./api/subscription-adapter";
export type {
  OrderConnectionState,
  OrderSubscriptionPort,
  RawOrderSubscriptionTransport,
  RealtimeSubscription,
} from "./api/subscription-adapter";

export { OrderStatusBadge } from "./components/order-status-badge";
export type { OrderStatusBadgeProps } from "./components/order-status-badge";
export { OrderTimeline } from "./components/order-timeline";
export type { OrderTimelineProps } from "./components/order-timeline";
export { OrderCard } from "./components/order-card";
export type { OrderCardProps } from "./components/order-card";
export { OrderTable } from "./components/order-table";
export type { OrderTableProps } from "./components/order-table";
export { OrdersPage } from "./pages/orders-page";
export type { OrdersPageProps, OrdersPageState } from "./pages/orders-page";
export { OrderDetailPage } from "./pages/order-detail-page";
export type {
  OrderDetailPageProps,
  OrderDetailPageState,
} from "./pages/order-detail-page";
