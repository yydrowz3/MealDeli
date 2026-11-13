import { useForm } from "react-hook-form";
import FormError from "../components/form-error.tsx";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import type {
    LoginMutation,
    LoginMutationVariables,
} from "../types/__generated__/graphql.ts";
import logoSVG from "../images/logo.svg";
import Button from "../components/button.tsx";
import { Link } from "react-router";
import validator from "validator";
import { authTokenVar, isLoggedInVar } from "../apollo.ts";
import { LOCALSTORAGE_TOKEN } from "../constants.ts";

// $ means it is a variable
const LOGIN_MUTATION = gql`
    mutation login($loginInput: LoginInput!) {
        login(input: $loginInput) {
            ok
            token
            error
        }
    }
`;

interface ILoginForm {
    email: string;
    password: string;
}

function Login() {
    const {
        register,
        formState: { errors, isValid },
        handleSubmit,
        getValues,
    } = useForm<ILoginForm>({ mode: "onChange" });

    const [loginMutation, { data: loginMutationResult, loading }] = useMutation<
        LoginMutation,
        LoginMutationVariables
    >(LOGIN_MUTATION, {
        onCompleted: (data) => {
            const {
                login: { ok, token },
            } = data;
            if (ok && token) {
                // console.log(token);
                localStorage.setItem(LOCALSTORAGE_TOKEN, token);
                authTokenVar(token);
                isLoggedInVar(true);
            }
        },
    });

    function onSubmit() {
        const { email, password } = getValues();
        loginMutation({ variables: { loginInput: { email, password } } });
    }

    return (
        <div className="h-screen flex items-center flex-col mt-10 lg:mt-28">
            {/* <div className="bg-white w-full max-w-lg pt-10 pb-8 rounded-lg text-center"> */}
            {/* <h3 className="text-2xl text-gray-800">Log In</h3> */}
            <article>
                <title>Login</title>
            </article>
            <div className="w-full max-w-screen-sm px-5">
                <img src={logoSVG} className="h-20 mb-10 mx-auto" />
                <h4 className="w-full text-left text-3xl mb-5 font-bold">
                    Welcome back
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
                            validate: (value) => {
                                return (
                                    validator.isEmail(value) || "Invalid email"
                                );
                            },
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
                            minLength: 6,
                        })}
                    />
                    {errors.password?.type === "minLength" && (
                        <FormError errorMessage="Password must be more than 10 chars" />
                    )}
                    <Button
                        canClick={isValid}
                        loading={loading}
                        actionText={"Log In"}
                    />
                    {loginMutationResult?.login.error && (
                        <FormError
                            errorMessage={loginMutationResult.login.error}
                        />
                    )}
                </form>
                <div className="text-center mt-3">
                    New to us?{" "}
                    <Link
                        to="/create-account"
                        className="text-cyan-600 hover:underline"
                    >
                        Create an Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
export default Login;
