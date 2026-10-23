import "./owner-insights.css";

export { computeOwnerMetrics } from "./model/analytics";
export type {
  DailySales,
  OwnerAnalyticsDiagnostic,
  OwnerMetrics,
  TopDish,
} from "./model/analytics";
export { buildLocalDateBuckets } from "./model/date-buckets";
export type { LocalDateBucket } from "./model/date-buckets";
export {
  createDemoTransactionId,
  createPromotionCoordinator,
  DEMO_PROMOTION,
  getPromotionState,
  truncateTransactionId,
} from "./model/promotion";
export type {
  CreatePromotionResult,
  PromotionCoordinator,
  PromotionData,
  PromotionDiagnostic,
  PromotionPayment,
  PromotionRepository,
  PromotionRestaurant,
  PromotionState,
  PromotionSubmitResult,
} from "./model/promotion";
export { createPromotionRepository, PromotionRepositoryError } from "./api/promotion-repository";
export type { PromotionGraphqlTransport } from "./api/promotion-repository";
export { OwnerDashboardPage } from "./pages/owner-dashboard-page";
export type { OwnerDashboardPageProps } from "./pages/owner-dashboard-page";
export { PromotionPage } from "./pages/promotion-page";
export type { PromotionPageProps } from "./pages/promotion-page";
