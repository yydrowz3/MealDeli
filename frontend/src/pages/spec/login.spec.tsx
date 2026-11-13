import { ApolloProvider } from "@apollo/client/react";
import { render, waitFor, type RenderResult } from "@testing-library/react";
import { createMockClient, type MockApolloClient } from "mock-apollo-client";
import { BrowserRouter } from "react-router";
import Login from "../login.tsx";
import userEvent from "@testing-library/user-event";
import { gql } from "@apollo/client";

const LOGIN_MUTATION = gql`
    mutation login($loginInput: LoginInput!) {
        login(input: $loginInput) {
            ok
            token
            error
        }
    }
`;

describe("<Login />", () => {
    let renderResult: RenderResult;
    let mockedClient: MockApolloClient;
    beforeEach(async () => {
        await waitFor(async () => {
            mockedClient = createMockClient();
            renderResult = render(
                <BrowserRouter>
                    <ApolloProvider client={mockedClient}>
                        <Login />
                    </ApolloProvider>
                </BrowserRouter>
            );
        });
    });

    it("should render OK", async () => {
        await waitFor(() => {
            expect(document.title).toBe("Login");
        });
    });

    it("displays email validation errors", async () => {
        const { getByPlaceholderText, getByRole } = renderResult;
        const email = getByPlaceholderText(/email/i);
        await waitFor(() => {
            userEvent.type(email, "hello@world");
        });
        let errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/please enter a valid email/i);
        await waitFor(() => {
            userEvent.clear(email);
        });
        errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/email is required/i);
    });

    it("display password required errors", async () => {
        const { getByPlaceholderText, getByRole } = renderResult;
        const email = getByPlaceholderText(/email/i);
        const submitBtn = getByRole("button");
        await waitFor(() => {
            userEvent.type(email, "hello@world.com");
            userEvent.click(submitBtn);
        });
        const errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/password is required/i);
    });

    it("submits form and calls mutation", async () => {
        const { getByPlaceholderText, getByRole } = renderResult;
        const email = getByPlaceholderText(/email/i);
        const password = getByPlaceholderText(/password/i);
        const submitBtn = getByRole("button");
        const formData = {
            email: "hello@world.com",
            password: "helloworld",
        };
        const mockedMutationResponse = vi.fn().mockResolvedValue({
            data: {
                login: {
                    ok: true,
                    token: "xxx",
                    error: "mutation-error",
                },
            },
        });
        mockedClient.setRequestHandler(LOGIN_MUTATION, mockedMutationResponse);
        vi.spyOn(Storage.prototype, "setItem");
        await waitFor(() => {
            userEvent.type(email, formData.email);
            userEvent.type(password, formData.password);
            userEvent.click(submitBtn);
        });
        expect(mockedMutationResponse).toHaveBeenCalledTimes(1);
        expect(mockedMutationResponse).toHaveBeenCalledWith({
            loginInput: {
                email: formData.email,
                password: formData.password,
            },
        }); // check the mutation to be called with some arguments, need a 3rd-parth client
        const errorMessage = getByRole("alert");
        expect(errorMessage).toHaveTextContent(/mutation-error/i);
        expect(localStorage.setItem).toHaveBeenCalledWith("token", "xxx");
    });
});
