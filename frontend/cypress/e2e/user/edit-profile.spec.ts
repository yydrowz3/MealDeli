describe("Edit Profile", () => {
    const user = cy;
    beforeEach(() => {
        user.login("hello@world.com", "helloworld");
    });
    it("can go to /edit-profile using the header", () => {
        user.get("a[href='/edit-profile']").click();
        user.wait(2000);
        user.title().should("eq", "Eidt Profile");
    });
    it("can change email", () => {
        user.intercept("POST", "http://localhost:3000/graphql", (req) => {
            if (req.body?.operationName === "editProfile") {
                //@ts-expect-error user intercept
                req.body?.variables?.input?.email = "hello@world.com";
            }
        });
        user.visit("/edit-profile");
        user.findByPlaceholderText(/email/i)
            .clear()
            .type("new_hello@world.com");
        user.findByRole("button").click();
    });
});
