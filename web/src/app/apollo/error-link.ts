import { CombinedGraphQLErrors, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { getOperationAST } from "graphql";
import type { RefreshCoordinator } from "./refresh-coordinator";

function isUnauthorized(error: unknown) {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(({ extensions }) => {
      const code = extensions?.code;
      return code === "UNAUTHENTICATED" || code === "UNAUTHORIZED";
    });
  }

  if (typeof error === "object" && error !== null && "statusCode" in error) {
    return (error as { statusCode?: number }).statusCode === 401;
  }
  return false;
}

export function createSessionErrorLink(coordinator: RefreshCoordinator) {
  return new ErrorLink(({ error, operation, forward }) => {
    if (!isUnauthorized(error) || operation.getContext().mealdeliAuthRetried === true) {
      return;
    }

    const operationType = getOperationAST(operation.query)?.operation;
    const canRetry =
      operationType === "query" || operation.getContext().retryOnUnauthorized === true;
    if (!canRetry) {
      return;
    }

    operation.setContext({ mealdeliAuthRetried: true });
    return new Observable((observer) => {
      let subscription: { unsubscribe: () => void } | undefined;
      let active = true;

      void coordinator.refresh().then(
        (accessToken) => {
          if (!active) return;
          const context = operation.getContext();
          operation.setContext({
            ...context,
            headers: {
              ...(context.headers as Record<string, string> | undefined),
              authorization: `Bearer ${accessToken}`,
            },
          });
          subscription = forward(operation).subscribe(observer);
        },
        (refreshError: unknown) => {
          if (active) observer.error(refreshError);
        },
      );

      return () => {
        active = false;
        subscription?.unsubscribe();
      };
    });
  });
}
