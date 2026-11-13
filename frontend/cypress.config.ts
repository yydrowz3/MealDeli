import { defineConfig } from "cypress";
import vitePreprocessor from "cypress-vite";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        // setupNodeEvents(on, config) {
        //   // implement node event listeners here
        // },
        setupNodeEvents(on) {
            on("file:preprocessor", vitePreprocessor());
        },
    },
});
