import { render } from "@testing-library/react";
import FormError from "../form-error.tsx";

describe("<FormError />", () => {
    it("renders OK with props", () => {
        const { getByText } = render(<FormError errorMessage="test" />);
        getByText("test");
    });
});
