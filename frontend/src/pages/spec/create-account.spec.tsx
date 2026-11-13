import { ApolloProvider } from "@apollo/client/react";
import { render, waitFor, type RenderResult } from "@testing-library/react";
import { createMockClient, type MockApolloClient } from "mock-apollo-client";
import CreateAccount from "../create-account.tsx";
import { BrowserRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { UserRole } from "../../types/__generated__/graphql.ts";
import { gql } from "@apollo/client";

const CREATE_ACCOUNT_MUTATION = gql`
    mutation createAccount($createAccountInput: CreateAccountInput!) {
        createAccount(input: $createAccountInput) {
            ok
            error
        }
    }
`;

const mockNavigate = vi.fn();

vi.mock(import("react-router"), () => {
    const realModule = vi.importActual("react-router");
    return {
        ...realModule,
        useNavigate: () => {
            return {
                navigate: mockNavigate,
            };
        },
    };
});

describe("<CreateAccount />", () => {
    let mockedClient: MockApolloClient;
    let renderResult: RenderResult;
    beforeEach(async () => {
        await waitFor(() => {
            mockedClient = createMockClient();
            renderResult = render(
                <BrowserRouter>
                    <ApolloProvider client={mockedClient}>
                        <CreateAccount />
                    </ApolloProvider>
                </BrowserRouter>
            );
        });
    });

    it("renders OK", async () => {
        await waitFor(() => expect(document.title).toBe("Create Account"));
    });

    it("renders validation errors", async () => {
        const { getByRole, getByPlaceholderText } = renderResult;
        const email = getByPlaceholderText(/email/i);
        const button = getByRole("button");
        await waitFor(() => {
            userEvent.type(email, "hello@work");
        });
        let errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/please enter a valid email/i);
        await waitFor(() => {
            userEvent.clear(email);
        });
        errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/email is required/i);
        await waitFor(() => {
            userEvent.type(email, "hello@world.com");
            userEvent.click(button);
        });
        errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/password is required/i);
    });

    it("submits mutation with form values", async () => {
        const { getByRole, getByPlaceholderText } = renderResult;
        const email = getByPlaceholderText(/email/i);
        const password = getByPlaceholderText(/password/i);
        const button = getByRole("button");
        const formData = {
            email: "working@mail.com",
            password: "12",
            role: UserRole.Client,
        };
        const mockedLoginMutationResponse = vi.fn().mockResolvedValue({
            data: {
                createAccount: {
                    ok: true,
                    error: "mutation-error",
                },
            },
        });
        mockedClient.setRequestHandler(
            CREATE_ACCOUNT_MUTATION,
            mockedLoginMutationResponse
        );
        vi.spyOn(window, "alert").mockImplementation(() => null);
        await waitFor(() => {
            userEvent.type(email, formData.email);
            userEvent.type(password, formData.password);
            userEvent.click(button);
        });
        expect(mockedLoginMutationResponse).toHaveBeenCalledTimes(1);
        expect(mockedLoginMutationResponse).toHaveBeenCalledWith({
            createAccountInput: {
                email: formData.email,
                password: formData.password,
                role: formData.role,
            },
        });
        expect(window.alert).toHaveBeenCalledWith(
            "Account Created! Log in now!"
        );
        const mutationError = getByRole("alert");
        expect(mutationError).toHaveTextContent("mutation-error");
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    afterAll(() => {
        vi.clearAllMocks();
    });
});
