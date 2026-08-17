export const DEMO_PROMOTION = {
  priceMinor: 999,
  currency: "USD",
  durationDays: 7,
} as const;

export type PromotionState = "inactive" | "active" | "submitting" | "error";

export type PromotionRestaurant = Readonly<{
  id: string;
  name: string;
  promotedUntil: string | null;
}>;

export type PromotionPayment = Readonly<{
  id: string;
  transactionId: string;
  restaurantId: string;
  restaurantName: string;
  createdAt: string;
}>;

export type PromotionData = Readonly<{
  restaurant: PromotionRestaurant;
  payments: readonly PromotionPayment[];
}>;

export type PromotionDiagnostic = (
  message: string,
  details?: Readonly<Record<string, unknown>>,
) => void;

export function getPromotionState(
  promotedUntil: string | null | undefined,
  now: Date,
  diagnostic?: PromotionDiagnostic,
): "inactive" | "active" {
  if (!promotedUntil) return "inactive";
  const date = new Date(promotedUntil);
  if (Number.isNaN(date.getTime())) {
    diagnostic?.("Promotion has an invalid promotedUntil value.", { promotedUntil });
    return "inactive";
  }
  return date.getTime() > now.getTime() ? "active" : "inactive";
}

export function createDemoTransactionId(uuid: () => string): string {
  return `demo_${uuid()}`;
}

export function truncateTransactionId(transactionId: string): string {
  if (transactionId.length <= 18) return transactionId;
  return `${transactionId.slice(0, 10)}…${transactionId.slice(-6)}`;
}

export type CreatePromotionResult =
  | Readonly<{ kind: "created" }>
  | Readonly<{ kind: "duplicate" }>
  | Readonly<{ kind: "failed"; message: string }>;

export interface PromotionRepository {
  refresh(restaurantId: string): Promise<PromotionData | null>;
  create(restaurantId: string, transactionId: string): Promise<CreatePromotionResult>;
}

export type PromotionSubmitResult =
  | Readonly<{ kind: "activated"; data: PromotionData; transactionId: string }>
  | Readonly<{ kind: "already-active" }>
  | Readonly<{ kind: "error"; message: string; transactionId: string }>;

export interface PromotionCoordinator {
  submit(currentPromotedUntil: string | null): Promise<PromotionSubmitResult>;
  getPendingTransactionId(): string | null;
}

export function createPromotionCoordinator(input: Readonly<{
  restaurantId: string;
  repository: PromotionRepository;
  uuid: () => string;
  clock: () => Date;
  diagnostic?: PromotionDiagnostic;
}>): PromotionCoordinator {
  let transactionId: string | null = null;
  return {
    getPendingTransactionId: () => transactionId,
    async submit(currentPromotedUntil) {
      if (getPromotionState(currentPromotedUntil, input.clock(), input.diagnostic) === "active") {
        return { kind: "already-active" };
      }
      transactionId ??= createDemoTransactionId(input.uuid);
      const attemptedTransactionId = transactionId;
      try {
        const result = await input.repository.create(input.restaurantId, attemptedTransactionId);
        if (result.kind === "failed") {
          return { kind: "error", message: result.message, transactionId: attemptedTransactionId };
        }
        const data = await input.repository.refresh(input.restaurantId);
        if (
          data &&
          getPromotionState(data.restaurant.promotedUntil, input.clock(), input.diagnostic) === "active"
        ) {
          transactionId = null;
          return { kind: "activated", data, transactionId: attemptedTransactionId };
        }
        return {
          kind: "error",
          message: "We couldn’t confirm the promotion. Try again.",
          transactionId: attemptedTransactionId,
        };
      } catch {
        return {
          kind: "error",
          message: "We couldn’t activate the promotion. Try again.",
          transactionId: attemptedTransactionId,
        };
      }
    },
  };
}
