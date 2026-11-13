import { render, waitFor } from "@testing-library/react";
import App from "./App.tsx";
import { isLoggedInVar } from "./apollo.ts";

// beforeEach(() => {
//     render(<App />);
// });

vi.mock("./routers/logged-out-router", () => {
    // const actual = await importOriginal();
    return {
        // ...actual,
        default: () => <span>logged-out</span>, // vitest needs the default export
        // LoggedOutRouter: () => <span>logged-out</span>,
    };
});

vi.mock("./routers/logged-in-router", () => {
    return {
        default: () => <span>logged-in</span>,
    };
});

describe("<App />", () => {
    it("renders LoggedOutRouter", () => {
        const { getByText } = render(<App />);
        getByText("logged-out");
    });

    it("renders LoggedInRouter", async () => {
        const { getByText } = render(<App />);
        await waitFor(() => isLoggedInVar(true)); // wait to finish the refreshing
        // debug();
        getByText("logged-in");
    });
});
