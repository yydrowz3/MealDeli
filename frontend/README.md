# MealRelay - Frontend

For a modern React-based web system construction, we initialize this project with `Vite`. Please make sure the `Node` version meets the minium requirement.

The frontend is built with `React` framework, and the form and router are handled with `React-Hook-Form` and `React-Router`.

The UI interface is designed with `Tailwind CSS` and this project does not include other UI components.

The data fetch with the backend is implemented with `GraphQL` rules, and the types are generated with `Apollo Codegen` automatically.

## How to use

Before executing the MealRelay frontend, you should create a `.env` configuration file in the frontend directory as `./frontend/.env`;

You can update and customize your configurations, but before deploying, make sure you included these key and values:

```
VITE_GOOGLE_MAPS=your google maps api key
```

> Don't forget to add the `VITE_` prefix to enable environment variables can be fetched by `Vite`

For running forntend server on your local machine, please run the following commands:

```sh
cd ./frontend
pnpm install
pnpm run dev
```

By default, your backend server will start at `http://localhost:5173`.

Similarly, if you need to compile into a production mode, please run:

```sh
pnpm run build
```

The output will be saved in `./frontend/dist/` directory.

## Testing

Since the `Jest` testing framework does not support `Vite` based project, currently. This project is tested with `Vitest` library for **Unit Test**, which has a similar test interface with Jest.

For an End-to-End test on a React based web system, this project uses `Cypress` for the E2E testing.

To enbale e2e testing, you should first enable the `post-build` feature for pnpm, and then when you finish installing dependencies, an executable `Cypress` application would be installed to you local system.

To run the test process, please change the current path to frontend root directory, and run the following commands:

-   Unit Test:

```sh
pnpm run test
```

-   E2E Test:

```sh
pnpm run cy:open
```

After this, the `Cypress` will open, and the following testing process should continue on a browser GUI interface.

-   Test Coverage:

```sh
pnpm run coverage
```

## Optional Vite Configuration and ESLint Setup.

Currently, two official plugins are available:

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
-   [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            // Other configs...

            // Remove tseslint.configs.recommended and replace with this
            ...tseslint.configs.recommendedTypeChecked,
            // Alternatively, use this for stricter rules
            ...tseslint.configs.strictTypeChecked,
            // Optionally, add this for stylistic rules
            ...tseslint.configs.stylisticTypeChecked,

            // Other configs...
        ],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.node.json", "./tsconfig.app.json"],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            // Other configs...
            // Enable lint rules for React
            reactX.configs["recommended-typescript"],
            // Enable lint rules for React DOM
            reactDom.configs.recommended,
        ],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.node.json", "./tsconfig.app.json"],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
]);
```

## License

MIT License.
