import { ApolloProvider } from "@apollo/client/react";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import { ToastViewport } from "../../shared/ui";
import { AppErrorBoundary } from "../errors/app-error-boundary";
import type { AppServices } from "./create-app-services";

export function AppProviders(props: { services: AppServices; children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <JotaiProvider store={props.services.jotaiStore}>
        <ApolloProvider client={props.services.apolloClient}>
          {props.children}
          <ToastViewport />
        </ApolloProvider>
      </JotaiProvider>
    </AppErrorBoundary>
  );
}
