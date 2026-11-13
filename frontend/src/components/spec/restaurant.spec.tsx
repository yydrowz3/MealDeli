import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import Restaurant from "../restaurant.tsx";

describe("<Restaurant />", () => {
    it("renders OK with props", () => {
        const restaurantProps = {
            id: "1",
            name: "name",
            categoryName: "categoryName",
            coverImg: "lala",
        };
        const { getByText, container } = render(
            <BrowserRouter>
                <Restaurant {...restaurantProps} />
            </BrowserRouter>
        );
        getByText(restaurantProps.name);
        getByText(restaurantProps.categoryName);
        expect(container.firstChild).toHaveAttribute(
            "href",
            `/restaurants/${restaurantProps.id}`
        );
    });
});
