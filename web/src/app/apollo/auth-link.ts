import { ApolloLink } from "@apollo/client";

export function createAuthLink(getAccessToken: () => string | null) {
  return new ApolloLink((operation, forward) => {
    const accessToken = getAccessToken();
    const context = operation.getContext();
    const headers = { ...(context.headers as Record<string, string> | undefined) };

    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }

    operation.setContext({ ...context, headers });
    return forward(operation);
  });
}
