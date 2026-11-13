import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

export const user = userEvent.setup();

afterEach(() => {
    cleanup();
});
