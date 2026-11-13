describe("Create Account", () => {
    const user = cy;
    it("should see email / password validation errors", () => {
        user.visit("/");
        user.findByText(/create an account/i).click();
        user.findByPlaceholderText(/email/i).type("not@email");
        user.findByRole("alert").should(
            "have.text",
            "Please enter a valid email"
        );
        user.findByPlaceholderText(/email/i).clear();
        user.findByRole("alert").should("have.text", "Email is required");
        user.findByPlaceholderText(/email/i).type("valid@email.com");
        user.findByPlaceholderText(/password/i)
            .type("a")
            .clear();
        user.findByRole("alert").should("have.text", "Password is required");
    });

    it("should be able to create account and login", () => {
        user.intercept("POST", "http://localhost:3000/graphql", (req) => {
            const { operationName } = req.body;
            if (operationName && operationName === "createAccountMutation") {
                req.reply((res) => {
                    res.send({
                        fixture: "auth/create-account.json",
                    });
                });
            }
        });
        user.visit("/create-account");
        user.findByPlaceholderText(/email/i).type("hello@world.com");
        user.findByPlaceholderText(/password/i).type("helloworld");
        user.findByRole("button").click();
        user.wait(1000);
        user.login("hello@world.com", "helloworld");
    });
});
