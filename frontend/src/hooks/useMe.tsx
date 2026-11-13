import { gql } from "@apollo/client";
import type { MeQuery } from "../types/__generated__/graphql.ts";
import { useQuery } from "@apollo/client/react";

export const ME_QUERY = gql`
    query me {
        me {
            id
            email
            role
            verified
        }
    }
`;

export function useMe() {
    return useQuery<MeQuery>(ME_QUERY);
}
