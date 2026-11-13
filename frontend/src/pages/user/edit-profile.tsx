import { gql } from "@apollo/client";
import { useMe } from "../../hooks/useMe.tsx";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import validator from "validator";
import type {
    EditProfileMutation,
    EditProfileMutationVariables,
} from "../../types/__generated__/graphql.ts";
import Button from "../../components/button.tsx";

const EDIT_PROFILE_MUTATION = gql`
    mutation editProfile($input: EditProfileInput!) {
        editProfile(input: $input) {
            ok
            error
        }
    }
`;

interface IFormProps {
    email?: string;
    password?: string;
}

function EditProfile() {
    const { data: userData } = useMe();
    const client = useApolloClient();
    const { register, handleSubmit, getValues, formState } =
        useForm<IFormProps>({
            mode: "onChange",
            defaultValues: {
                email: userData?.me.email,
            },
        });
    const [editProfile, { loading }] = useMutation<
        EditProfileMutation,
        EditProfileMutationVariables
    >(EDIT_PROFILE_MUTATION, {
        onCompleted: (data: EditProfileMutation) => {
            const {
                editProfile: { ok },
            } = data;
            if (ok && userData) {
                const {
                    me: { email: prevEmail, id },
                } = userData;
                const { email: newEmail } = getValues();
                if (prevEmail !== newEmail) {
                    client.writeFragment({
                        id: `User:${id}`,
                        fragment: gql`
                            fragment EditedUser on User {
                                verified
                                email
                            }
                        `,
                        data: {
                            email: newEmail,
                            verified: false,
                        },
                    });
                }
            }
        },
    });

    function onSumbit() {
        const { email, password } = getValues();
        editProfile({
            variables: {
                input: {
                    email,
                    ...(password !== "" && { password }),
                },
            },
        });
    }

    return (
        <div className="mt-52 flex flex-col justify-center items-center">
            <article>
                <title>Edit Profile</title>
            </article>
            <h4 className="font-semibold text-2xl mb-3">Edit Profile</h4>
            <form
                className="grid max-w-screen-sm gap-3 mt-5 w-full mb-5"
                onSubmit={handleSubmit(onSumbit)}
            >
                <input
                    className="input"
                    type="email"
                    placeholder="Email"
                    {...register("email", {
                        // required: "Email is required",
                        validate: (value) => {
                            if (!value) return true;
                            else
                                return (
                                    validator.isEmail(value) || "Invalid email"
                                );
                        },
                    })}
                />
                <input
                    className="input"
                    type="password"
                    placeholder="Password"
                    {...register("password")}
                />
                <Button
                    loading={loading}
                    canClick={formState.isValid}
                    actionText="Save Profile"
                />
            </form>
        </div>
    );
}
export default EditProfile;
