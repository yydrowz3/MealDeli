import { createStore } from "jotai/vanilla";
import type { ApolloClient } from "@apollo/client";
import { anonymousAuthPort } from "../apollo/auth-port";
import type { AuthPort } from "../apollo/auth-port";
import { createApolloClient } from "../apollo/create-apollo-client";
import type { RuntimeConfig } from "../config/runtime-config";

export type AppServices = {
  apolloClient: ApolloClient;
  jotaiStore: ReturnType<typeof createStore>;
  runtimeConfig: RuntimeConfig;
  dispose: () => void;
};

export type AppServiceOptions = {
  auth?: AuthPort;
  clearPrivateState?: () => void | Promise<void>;
  onSessionExpired?: () => void | Promise<void>;
};

export function createAppServices(
  config: RuntimeConfig,
  store: ReturnType<typeof createStore> = createStore(),
  options: AppServiceOptions = {},
): AppServices {
  const { apolloClient, subscriptionLink } = createApolloClient({
    config,
    auth: options.auth ?? anonymousAuthPort,
    clearPrivateState: options.clearPrivateState,
    onSessionExpired: options.onSessionExpired ?? (() => window.location.assign("/login")),
  });
  return {
    apolloClient,
    jotaiStore: store,
    runtimeConfig: config,
    dispose: () => subscriptionLink.dispose(),
  };
}
