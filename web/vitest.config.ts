import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.spec.{ts,tsx}",
        "src/**/testing/**",
        "src/**/fixtures/**",
        "src/**/handlers.ts",
        "src/**/index.ts",
        "src/gql/**",
        "src/routeTree.gen.ts",
        "src/main.tsx",
        "src/utils/apollo.ts",
        "src/utils/codegen.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
