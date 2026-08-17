import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import type { AuthPort } from "./auth-port";
import { createAuthLink } from "./auth-link";
import { createSessionErrorLink } from "./error-link";
import { createRefreshCoordinator } from "./refresh-coordinator";
import { RestartableSubscriptionLink } from "./subscription-link";
import type { RuntimeConfig } from "../config/runtime-config";

export type ApolloServices = {
  apolloClient: ApolloClient;
  subscriptionLink: RestartableSubscriptionLink;
};

export function createApolloClient(options: {
  config: RuntimeConfig;
  auth: AuthPort;
  clearPrivateState?: () => void | Promise<void>;
  onSessionExpired?: () => void | Promise<void>;
}): ApolloServices {
  let apolloClient: ApolloClient | undefined;
  const refreshCoordinator = createRefreshCoordinator({
    refreshAccessToken: options.auth.refreshAccessToken,
    onRefreshFailed: async () => {
      await options.auth.clearSession();
      await options.clearPrivateState?.();
      await apolloClient?.clearStore();
      await options.onSessionExpired?.();
    },
  });
  const subscriptionLink = new RestartableSubscriptionLink({
    url: options.config.apiWsUrl,
    getAccessToken: options.auth.getAccessToken,
    subscribeAccessToken: options.auth.subscribeAccessToken,
  });
  const httpLink = new HttpLink({
    uri: options.config.apiHttpUrl,
    credentials: "include",
  });
  const transport = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    subscriptionLink,
    httpLink,
  );

  apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: createSessionErrorLink(refreshCoordinator).concat(
      createAuthLink(options.auth.getAccessToken).concat(transport),
    ),
  });

  return { apolloClient, subscriptionLink };
}
