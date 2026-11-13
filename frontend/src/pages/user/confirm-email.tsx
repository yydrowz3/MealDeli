import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type {
    VerifyEmailMutation,
    VerifyEmailMutationVariables,
} from "../../types/__generated__/graphql.ts";
import { useMe } from "../../hooks/useMe.tsx";

const VERIFY_EMAIL_MUTATION = gql`
    mutation verifyEmail($input: VerifyEmailInput!) {
        verifyEmail(input: $input) {
            ok
            error
        }
    }
`;

function ConfirmEmail() {
    const { data: userData } = useMe();
    const client = useApolloClient();
    const navigate = useNavigate();
    const [verifyEmail] = useMutation<
        VerifyEmailMutation,
        VerifyEmailMutationVariables
    >(VERIFY_EMAIL_MUTATION, {
        onCompleted: (data: VerifyEmailMutation) => {
            const {
                verifyEmail: { ok },
            } = data;
            if (ok && userData?.me.id) {
                client.writeFragment({
                    id: `User:${userData.me.id}`,
                    fragment: gql`
                        fragment VerifiedUser on User {
                            verified
                        }
                    `,
                    data: {
                        verified: true,
                    },
                });
                navigate("/");
            }
        },
    });
    const location = useLocation();
    useEffect(() => {
        const { search } = location;
        const params = new URLSearchParams(search);
        const code = params.get("code") || "";
        verifyEmail({
            variables: {
                input: {
                    code,
                },
            },
        });
    }, [verifyEmail, location]);
    return (
        <div className="mt-52 flex flex-col items-center justify-center">
            <article>
                <title>Verify Email</title>
            </article>
            <h2 className="text-lg mb-1 font-medium">Confirming email...</h2>
            <h4 className="text-gray-700 text-sm">
                Please wait, don't close this page...
            </h4>
        </div>
    );
}
export default ConfirmEmail;
