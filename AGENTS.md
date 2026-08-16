# Repository Guidelines

## Project Structure & Module Organization

MealDeli has two pnpm projects. `api/` is a NestJS GraphQL service; feature modules live in `api/src/<feature>/`, with resolvers/controllers, services, DTOs, and entities kept together. Prisma schema, migrations, seed code, and sample data are under `api/prisma/`. Unit tests are colocated as `*.spec.ts`; end-to-end tests live in `api/test/`. The React/Vite client uses `web/src/routes/`, `web/src/utils/`, `web/src/assets/`, and `web/public/`. Do not hand-edit generated Prisma clients, `routeTree.gen.ts`, `dist/`, or `coverage/`.

## Build, Test, and Development Commands

Run `pnpm install` in each subdirectory; there is no root package script.

- `cd api && pnpm start:dev` — run the API with watch mode; `pnpm build` compiles it.
- `cd api && pnpm lint && pnpm format` — lint and format API TypeScript.
- `cd api && pnpm test` — run Jest units; use `pnpm test:e2e` or `pnpm test:cov` for end-to-end tests or coverage.
- `cd api && pnpm exec prisma generate` — refresh the client after schema edits; use `prisma migrate dev --name <change>` for migrations.
- `cd web && pnpm dev` — start Vite; `pnpm build` type-checks and bundles, while `pnpm lint` runs Oxlint.
- `cd web && pnpm codegen` — regenerate GraphQL operation types after schema or query changes.

## Coding Style & Naming Conventions

Use strict TypeScript and two-space indentation. API files use Prettier (single quotes and trailing commas); web files use double quotes and Oxlint. Use PascalCase for classes/components, camelCase for functions/variables, and kebab-case role-suffixed files such as `edit-profile.dto.ts`. Keep GraphQL metadata and validation beside DTO/entity definitions.

## Testing Guidelines

Jest and `@nestjs/testing` cover API units; Supertest covers e2e behavior. Name tests `<subject>.spec.ts` and `<feature>.e2e-spec.ts`. Cover success and failure paths for service, resolver, authentication, and persistence changes. No web test runner or coverage threshold is configured; run API tests and both builds before review.

## Commit & Pull Request Guidelines

Recent commits use an emoji plus Conventional Commit type, for example `🐞 fix: fix connection params`. Keep subjects short, imperative, and focused (`🔧 feat: add order cancellation`). PRs should describe behavior, schema/migration and configuration changes, link relevant issues, list verification commands, and include screenshots for UI changes or GraphQL examples for API changes.

## Security & Configuration

Copy `api/.env.example` to `api/.env`; never commit secrets. Required integrations include PostgreSQL (`DATABASE_URL`), JWT credentials, Resend, and S3-compatible storage. Review generated migrations before committing, and keep credentials and production data out of fixtures, logs, and screenshots.
