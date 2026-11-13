import { render, waitFor } from "@testing-library/react";
import NotFound from "../404.tsx";
import { BrowserRouter } from "react-router";

describe("<NotFound />", () => {
    it("renders OK", async () => {
        render(
            <BrowserRouter>
                <NotFound />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(document.title).toBe("Page Not Found"); // helmet doesn't change immediately
        });
    });
});
