import { ApolloProvider } from "@apollo/client/react";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import { ToastViewport } from "../../shared/ui";
import { AppErrorBoundary } from "../errors/app-error-boundary";
import type { AppServices } from "./create-app-services";
import { useTheme } from "../theme/use-theme";

export function AppProviders(props: { services: AppServices; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <AppErrorBoundary>
      <JotaiProvider store={props.services.jotaiStore}>
        <ApolloProvider client={props.services.apolloClient}>
          {props.children}
          <ToastViewport theme={theme} />
        </ApolloProvider>
      </JotaiProvider>
    </AppErrorBoundary>
  );
}
