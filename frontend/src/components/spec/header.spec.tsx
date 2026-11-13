import { MockedProvider } from "@apollo/client/testing/react";
import { render, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import Header from "../header.tsx";
import { ME_QUERY } from "../../hooks/useMe.tsx";

const mocks_banner = [
    {
        request: {
            query: ME_QUERY,
        },
        result: {
            data: {
                me: {
                    id: 1,
                    email: "",
                    role: "",
                    verified: false,
                },
            },
        },
    },
];

const mocks_no_banner = [
    {
        request: {
            query: ME_QUERY,
        },
        result: {
            data: {
                me: {
                    id: 1,
                    email: "",
                    role: "",
                    verified: true,
                },
            },
        },
    },
];

describe("<Header />", () => {
    it("renders verify banner", async () => {
        await waitFor(async () => {
            const { getByText } = render(
                <MockedProvider mocks={mocks_banner}>
                    <BrowserRouter>
                        <Header />
                    </BrowserRouter>
                </MockedProvider>
            );
            await new Promise((resolve) => setTimeout(resolve, 0));
            getByText("Please verify your email.");
        });
    });

    it("renders without verify banner", async () => {
        await waitFor(async () => {
            const { queryByText } = render(
                <MockedProvider mocks={mocks_no_banner}>
                    <BrowserRouter>
                        <Header />
                    </BrowserRouter>
                </MockedProvider>
            );
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(queryByText("Please verify your email.")).toBeNull(); // getByText will directly fail
        });
    });
});
