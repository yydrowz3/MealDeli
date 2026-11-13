import {
    ApolloClient,
    // ApolloLink,
    createHttpLink,
    // HttpLink,
    InMemoryCache,
    makeVar,
    split,
} from "@apollo/client";
import { LOCALSTORAGE_TOKEN } from "./constants.ts";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
// import { OperationTypeNode } from "graphql";
import { getMainDefinition } from "@apollo/client/utilities";

const token = localStorage.getItem(LOCALSTORAGE_TOKEN);
export const isLoggedInVar = makeVar(Boolean(token));
export const authTokenVar = makeVar(token);

// const httpLink = new HttpLink({ uri: "http://localhost:3000/graphql" });
// const authLink = new SetContextLink(({ headers }) => {
//     return {
//         headers: {
//             ...headers,
//             "x-jwt": authTokenVar() || "",
//         },
//     };
// });

// const wsLink = new GraphQLWsLink(
//     createClient({
//         url: "ws://localhost:3000/graphql",
//         connectionParams: {
//             "x-jwt": authTokenVar() || "",
//         },
//     })
// );

// const splitLink = ApolloLink.split(
//     ({ operationType }) => {
//         return operationType === OperationTypeNode.SUBSCRIPTION;
//     },
//     wsLink,
//     authLink.concat(httpLink)
// );

// const client = new ApolloClient({
//     link: splitLink,
//     cache: new InMemoryCache({
//         typePolicies: {
//             Query: {
//                 fields: {
//                     isLoggedIn: {
//                         read() {
//                             return isLoggedInVar();
//                         },
//                     },
//                     token: {
//                         read() {
//                             return authTokenVar();
//                         },
//                     },
//                 },
//             },
//         },
//     }),
// });

const httpLink = createHttpLink({
    uri: "http://localhost:3000/graphql",
});

const wsLink = new GraphQLWsLink(
    createClient({
        url: "ws://localhost:3000/graphql",
        connectionParams: {
            "x-jwt": authTokenVar() || "",
        },
    })
);

const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            "x-jwt": authTokenVar() || "",
        },
    };
});

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
    wsLink,
    authLink.concat(httpLink)
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    isLoggedIn: {
                        read() {
                            return isLoggedInVar();
                        },
                    },
                    token: {
                        read() {
                            return authTokenVar();
                        },
                    },
                },
            },
        },
    }),
});

export default client;
