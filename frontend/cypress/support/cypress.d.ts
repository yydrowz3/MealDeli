// cypress/support/cypress.d.ts
declare namespace Cypress {
    interface Chainable<Subject> {
        /**
         * Custom command to assert the user is logged in.
         * @example cy.assertLoggedIn()
         */
        assertLoggedIn(): Chainable<Subject>;
        assertLoggedOut(): Chainable<Subject>;
        login(email, password): Chainable<Subject>;
    }
}
