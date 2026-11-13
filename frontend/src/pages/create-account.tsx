import { useForm } from "react-hook-form";
import FormError from "../components/form-error.tsx";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
    UserRole,
    type CreateAccountMutation,
    type CreateAccountMutationVariables,
} from "../types/__generated__/graphql.ts";
import logoSVG from "../images/logo.svg";
import Button from "../components/button.tsx";
import { Link, useNavigate } from "react-router";

const CREATE_ACCOUNT_MUTATION = gql`
    mutation createAccount($createAccountInput: CreateAccountInput!) {
        createAccount(input: $createAccountInput) {
            ok
            error
        }
    }
`;

interface ICreateAccountForm {
    email: string;
    password: string;
    role: UserRole;
}

function CreateAccount() {
    const navigate = useNavigate();

    const {
        register,
        formState: { errors, isValid },
        handleSubmit,
        getValues,
    } = useForm<ICreateAccountForm>({
        mode: "onChange",
        defaultValues: {
            role: UserRole.Client,
        },
    });

    const [
        createAccountMutation,
        { loading, data: createAccountMutationResult },
    ] = useMutation<CreateAccountMutation, CreateAccountMutationVariables>(
        CREATE_ACCOUNT_MUTATION,
        {
            onCompleted: (data) => {
                const {
                    createAccount: { ok },
                } = data;
                if (ok) {
                    navigate("/");
                }
            },
        }
    );

    function onSubmit() {
        const { email, password, role } = getValues();
        createAccountMutation({
            variables: {
                createAccountInput: { email, password, role },
            },
        });
    }

    return (
        <div className="h-screen flex items-center flex-col mt-10 lg:mt-28">
            <article>
                <title>Create Account</title>
            </article>

            <div className="w-full max-w-screen-sm px-5">
                <img src={logoSVG} className="h-20 mb-10 mx-auto" />
                <h4 className="w-full text-left text-3xl mb-5 font-bold">
                    Let's get started
                </h4>
                <form
                    className="grid gap-3 mt-5 px-5"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <input
                        className="input"
                        type="email"
                        placeholder="Email"
                        {...register("email", {
                            required: "Email is required",
                        })}
                    />
                    {errors.email?.message && (
                        <FormError errorMessage={errors.email.message} />
                    )}
                    <input
                        className="input"
                        type="password"
                        placeholder="Password"
                        {...register("password", {
                            required: "Password is required",
                            minLength: 10,
                        })}
                    />
                    {errors.password?.type === "minLength" && (
                        <FormError errorMessage="Password must be more than 10 chars" />
                    )}

                    <select className="input" {...register("role")}>
                        {Object.keys(UserRole).map((role, index) => (
                            <option key={index}>{role}</option>
                        ))}
                    </select>

                    <Button
                        canClick={isValid}
                        loading={loading}
                        actionText={"Create Account"}
                    />
                    {createAccountMutationResult?.createAccount.error && (
                        <FormError
                            errorMessage={
                                createAccountMutationResult.createAccount.error
                            }
                        />
                    )}
                </form>
                <div className="text-center mt-3">
                    Already have an account?{" "}
                    <Link to="/" className="text-cyan-600 hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
export default CreateAccount;
