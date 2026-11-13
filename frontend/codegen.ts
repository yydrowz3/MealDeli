// import { CodegenConfig } from "@graphql-codegen/cli";

// const config: CodegenConfig = {
//     schema: "http://localhost:3000/graphql",
//     documents: ["src/**/*.tsx"],
//     generates: {
//         "./src/__generated__/": {
//             preset: "client",
//             presetConfig: {
//                 gqlTagName: "gql",
//             },
//         },
//         "./src/__generated__/types.ts": {
//             plugins: ["typescript", "typescript-operations"],
//         },
//     },
// };

// export default config;

import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    overwrite: true,
    schema: "http://localhost:3000/graphql",
    // This assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
    documents: ["src/**/*.{ts,tsx}"],
    // Don't exit with non-zero status when there are no documents
    ignoreNoDocuments: true,
    generates: {
        // Use a path that works the best for the structure of your application
        "./src/types/__generated__/graphql.ts": {
            plugins: ["typescript", "typescript-operations"],
            config: {
                avoidOptionals: {
                    // Use `null` for nullable fields instead of optionals
                    field: true,
                    // Allow nullable input fields to remain unspecified
                    inputValue: false,
                },
                // Use `unknown` instead of `any` for unconfigured scalars
                defaultScalarType: "unknown",
                // Apollo Client always includes `__typename` fields
                nonOptionalTypename: true,
                // Apollo Client doesn't add the `__typename` field to root types so
                // don't generate a type for the `__typename` for root operation types.
                skipTypeNameForRoot: true,
            },
        },
    },
};

export default config;
