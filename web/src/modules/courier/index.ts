import "./courier.css";

export type {
  CourierRepository,
  CourierCommandPort,
  TakeOrderResult,
  CompleteOrderResult,
} from "./api/courier-repository";
export { createCourierRepository } from "./api/courier-repository";
export { createCourierGraphqlCommandPort } from "./api/courier-repository";
export type { CourierGraphqlTransport } from "./api/courier-repository";

export type { AvailableOrder } from "./model/available-orders";
export {
  isAvailableOrder,
  mergeAvailableOrders,
  removeAvailableOrder,
  sortAvailableOrders,
} from "./model/available-orders";
export type { ActiveDeliverySelection } from "./model/active-delivery";
export { selectActiveDelivery } from "./model/active-delivery";
export type { DemoPoint, DemoRoute } from "./model/demo-route";
export { clampRouteProgress, createDemoRoute, stableOrderHash } from "./model/demo-route";
export {
  COURIER_ROUTE_STORAGE_KEY,
  advanceCourierRouteAtom,
  clearCourierRouteAtom,
  courierRouteAtom,
  createCourierRouteTestStore,
  createMemoryCourierStorage,
  createValidatedCourierStorage,
  initializeCourierRouteAtom,
} from "./model/route-atoms";
export type { JotaiStore, RouteTestStoreOptions, StoredCourierRoute } from "./model/route-atoms";
export { createCourierAvailableRealtimeAdapter } from "./model/realtime";

export { AvailableOrderCard } from "./components/available-order-card";
export type { AvailableOrderCardProps } from "./components/available-order-card";
export { ActiveDeliveryCard } from "./components/active-delivery-card";
export type { ActiveDeliveryCardProps } from "./components/active-delivery-card";
export { DeliveryMap } from "./components/delivery-map";
export type { DeliveryMapProps } from "./components/delivery-map";
export { MapFallback } from "./components/map-fallback";
export type { MapFallbackProps } from "./components/map-fallback";

export { CourierDashboardPage } from "./pages/courier-dashboard-page";
export type { CourierDashboardPageProps, CourierNotifier } from "./pages/courier-dashboard-page";
export { DeliveryPage } from "./pages/delivery-page";
export type { DeliveryPageProps } from "./pages/delivery-page";
export { CourierCompletedDeliveryPage, CourierHistoryPage } from "./pages/courier-history-page";
export type {
  CourierCompletedDeliveryPageProps,
  CourierHistoryPageProps,
} from "./pages/courier-history-page";
