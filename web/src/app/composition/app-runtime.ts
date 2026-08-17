import type { ApolloClient, OperationVariables } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { getOperationAST } from "graphql";
import { createStore } from "jotai/vanilla";

import {
  clearCartAtom,
  createOrderCommandRepository,
  createRecentOrderReconciler,
} from "../../modules/checkout";
import { createCatalogRepository } from "../../modules/catalog";
import {
  clearCourierRouteAtom,
  createCourierGraphqlCommandPort,
  createCourierRepository,
} from "../../modules/courier";
import {
  bootstrapSessionAtom,
  configureIdentityRepositoryAtom,
  createIdentityMediaAuthPort,
  createIdentityRepository,
  identityAtom,
} from "../../modules/identity";
import { createHttpMediaUploader } from "../../modules/media";
import {
  createOrderRepository,
  createOrderSubscriptionPort,
} from "../../modules/orders";
import {
  clearOwnerRestaurantSelectionAtom,
  createOwnerRestaurantRepository,
} from "../../modules/owner-management";
import { createPromotionRepository } from "../../modules/owner-insights";
import { createIdentityAuthPort } from "../apollo/identity-auth-port";
import type { RuntimeConfig } from "../config/runtime-config";
import { createAppServices } from "../providers/create-app-services";

function requireData<TResult>(data: TResult | null | undefined): TResult {
  if (data === null || data === undefined) {
    throw new Error("The MealDeli API returned no data.");
  }
  return data;
}

export function createApolloOperationTransport(client: ApolloClient) {
  return {
    async execute<TResult, TVariables>(
      document: TypedDocumentNode<TResult, TVariables>,
      variables: TVariables,
    ): Promise<TResult> {
      const operation = getOperationAST(document)?.operation;
      if (operation === "mutation") {
        const result = await client.mutate({
          mutation: document,
          variables: variables as OperationVariables,
        });
        return requireData(result.data as TResult | null | undefined);
      }
      const result = await client.query({
        query: document,
        variables: variables as OperationVariables,
        fetchPolicy: "network-only",
      });
      return requireData(result.data as TResult | null | undefined);
    },

    subscribe<TResult, TVariables>(
      document: TypedDocumentNode<TResult, TVariables>,
      variables: TVariables,
    ): AsyncIterable<Readonly<{ data?: TResult }>> {
      const observable = client.subscribe({
        query: document,
        variables: variables as OperationVariables,
      });
      return {
        async *[Symbol.asyncIterator]() {
          const queue: Array<Readonly<{ data?: TResult }>> = [];
          let wake: (() => void) | null = null;
          let finished = false;
          let failure: unknown;
          const subscription = observable.subscribe({
            next: (result) => {
              queue.push({ data: result.data as TResult | undefined });
              wake?.();
              wake = null;
            },
            error: (error) => {
              failure = error;
              finished = true;
              wake?.();
              wake = null;
            },
            complete: () => {
              finished = true;
              wake?.();
              wake = null;
            },
          });
          try {
            while (!finished || queue.length > 0) {
              if (queue.length === 0) {
                await new Promise<void>((resolve) => {
                  wake = resolve;
                });
                continue;
              }
              yield queue.shift()!;
            }
            if (failure) throw failure;
          } finally {
            subscription.unsubscribe();
          }
        },
      };
    },
  };
}

export function createMealDeliRuntime(config: RuntimeConfig) {
  const store = createStore();
  let identityRepository: ReturnType<typeof createIdentityRepository>;

  const clearPrivateState = () => {
    store.set(clearCartAtom);
    store.set(clearOwnerRestaurantSelectionAtom);
    store.set(clearCourierRouteAtom);
  };
  const auth = createIdentityAuthPort(store, () => identityRepository);
  const services = createAppServices(config, store, { auth, clearPrivateState });
  const transport = createApolloOperationTransport(services.apolloClient);

  identityRepository = createIdentityRepository(services.apolloClient);
  store.set(configureIdentityRepositoryAtom, identityRepository);

  const catalogRepository = createCatalogRepository(services.apolloClient);
  const orderRepository = createOrderRepository(transport);
  const orderCommandRepository = createOrderCommandRepository(transport);
  const ownerRepository = createOwnerRestaurantRepository(transport);
  const promotionRepository = createPromotionRepository(transport);
  const courierCommands = createCourierGraphqlCommandPort(transport, orderRepository);
  const courierRepository = createCourierRepository(courierCommands, orderRepository);
  const orderSubscriptions = createOrderSubscriptionPort(transport);
  const mediaUploader = createHttpMediaUploader({
    auth: createIdentityMediaAuthPort(store, identityRepository),
    endpoint: new URL("/uploads", config.apiHttpUrl).toString(),
  });

  let wasAuthenticated = false;
  const unsubscribeIdentity = store.sub(identityAtom, () => {
    const authenticated = store.get(identityAtom).status === "authenticated";
    if (wasAuthenticated && !authenticated) clearPrivateState();
    wasAuthenticated = authenticated;
  });
  void store.set(bootstrapSessionAtom);

  return {
    services,
    transport,
    identityRepository,
    catalogRepository,
    orderRepository,
    orderCommandRepository,
    ownerRepository,
    promotionRepository,
    courierRepository,
    orderSubscriptions,
    mediaUploader,
    reconcileOrder: createRecentOrderReconciler(orderRepository),
    clearPrivateState,
    dispose() {
      unsubscribeIdentity();
      services.dispose();
    },
  };
}

export type MealDeliRuntime = ReturnType<typeof createMealDeliRuntime>;

let runtime: MealDeliRuntime | null = null;

export function initializeMealDeliRuntime(config: RuntimeConfig): MealDeliRuntime {
  runtime ??= createMealDeliRuntime(config);
  return runtime;
}

export function getMealDeliRuntime(): MealDeliRuntime {
  if (!runtime) throw new Error("MealDeli runtime has not been initialized.");
  return runtime;
}
