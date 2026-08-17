import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { useFragment as readFragment, type FragmentType } from "../../../gql";
import {
  OwnerInsightsCreatePromotionDocument,
  OwnerInsightsPromotionHistoryDocument,
  OwnerInsightsPromotionRestaurantDocument,
  OwnerInsightsPromotionRestaurantFragmentDoc,
} from "../../../gql/graphql";
import type {
  CreatePromotionResult,
  PromotionData,
  PromotionPayment,
  PromotionRepository,
  PromotionRestaurant,
} from "../model/promotion";

export interface PromotionGraphqlTransport {
  execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult>;
}

export class PromotionRepositoryError extends Error {
  constructor(message = "The promotion request failed.", options?: ErrorOptions) {
    super(message, options);
    this.name = "PromotionRepositoryError";
  }
}

function isDuplicateMessage(message: string | null | undefined): boolean {
  return /already been processed|duplicate transaction/i.test(message ?? "");
}

function adaptRestaurant(
  reference: FragmentType<typeof OwnerInsightsPromotionRestaurantFragmentDoc>,
): PromotionRestaurant {
  const restaurant = readFragment(OwnerInsightsPromotionRestaurantFragmentDoc, reference);
  return {
    id: restaurant.id,
    name: restaurant.name,
    promotedUntil:
      typeof restaurant.promotedUntil === "string" ? restaurant.promotedUntil : null,
  };
}

export function createPromotionRepository(
  transport: PromotionGraphqlTransport,
): PromotionRepository {
  return {
    async refresh(restaurantId): Promise<PromotionData | null> {
      try {
        const [restaurantData, historyData] = await Promise.all([
          transport.execute(OwnerInsightsPromotionRestaurantDocument, {
            input: { id: restaurantId },
          }),
          transport.execute(OwnerInsightsPromotionHistoryDocument, {}),
        ]);
        const restaurantOutput = restaurantData.myRestaurant;
        if (!restaurantOutput.ok || !restaurantOutput.restaurant) {
          if (/not found|permission|don't own/i.test(restaurantOutput.error ?? "")) return null;
          throw new PromotionRepositoryError(
            restaurantOutput.error ?? "We couldn’t load this restaurant.",
          );
        }
        if (!historyData.getPayments.ok || !historyData.myRestaurants.ok) {
          throw new PromotionRepositoryError(
            historyData.getPayments.error ??
              historyData.myRestaurants.error ??
              "We couldn’t load promotion history.",
          );
        }
        const restaurantNames = new Map(
          (historyData.myRestaurants.restaurants ?? []).map((item) => [item.id, item.name]),
        );
        const payments: readonly PromotionPayment[] = (historyData.getPayments.payments ?? [])
          .map((payment) => ({
            id: payment.id,
            transactionId: payment.transactionId,
            restaurantId: payment.restaurantId,
            restaurantName: restaurantNames.get(payment.restaurantId) ?? "Restaurant unavailable",
            createdAt: String(payment.createdAt),
          }))
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
        return {
          restaurant: adaptRestaurant(restaurantOutput.restaurant),
          payments,
        };
      } catch (error) {
        if (error instanceof PromotionRepositoryError) throw error;
        throw new PromotionRepositoryError(undefined, { cause: error });
      }
    },

    async create(restaurantId, transactionId): Promise<CreatePromotionResult> {
      try {
        const data = await transport.execute(OwnerInsightsCreatePromotionDocument, {
          input: { restaurantId, transactionId },
        });
        const output = data.createPayment;
        if (output.ok) return { kind: "created" };
        if (isDuplicateMessage(output.error)) return { kind: "duplicate" };
        return {
          kind: "failed",
          message: output.error ?? "We couldn’t activate the promotion. Try again.",
        };
      } catch (error) {
        throw new PromotionRepositoryError(undefined, { cause: error });
      }
    },
  };
}
