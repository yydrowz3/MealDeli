# Repository Guidelines

## Project Structure & Module Organization

The application lives in `api/`; run project commands from that directory. NestJS source is under `api/src/`, organized by feature (`users/`, `auth/`, `jwt/`, `mails/`, `prisma/`, and `common/`). Keep each feature's module, resolver/controller, service, DTOs, entities, and enums together. Unit tests are co-located as `*.spec.ts`; end-to-end tests and their Jest configuration live in `api/test/`. The database schema and seed entry point are in `api/prisma/`. Treat `dist/`, `coverage/`, `node_modules/`, and `src/generated/prisma/` as generated output.

## Build, Test, and Development Commands

From `api/`, use pnpm (the lockfile is committed):

- `pnpm install` installs exact dependencies.
- `pnpm start:dev` runs Nest in watch mode; `pnpm build` compiles to `dist/`.
- `pnpm lint` runs ESLint and applies safe fixes; `pnpm format` formats source and tests.
- `pnpm test` runs unit tests; `pnpm test:watch` supports focused development.
- `pnpm test:e2e` runs the Supertest suite; `pnpm test:cov` writes coverage reports.
- `pnpm exec prisma generate` refreshes the Prisma client after schema changes; use `pnpm exec prisma migrate dev --name <change>` for local migrations.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, single quotes, and trailing commas; Prettier and ESLint are authoritative. Follow Nest conventions: PascalCase classes (`UsersService`), camelCase methods and variables, and kebab-case filenames with role suffixes such as `edit-profile.dto.ts` or `users.resolver.ts`. Keep DTO validation and GraphQL metadata near the DTO/entity definitions. Do not use unchecked nullable values where the strict TypeScript configuration can express the contract.

## Testing Guidelines

Jest and `@nestjs/testing` cover units; Supertest covers HTTP e2e behavior. Name unit files `<subject>.spec.ts` beside the implementation and e2e files `<feature>.e2e-spec.ts` in `test/`. Add success and failure-path tests for service, resolver, guard, and authentication changes. No numeric coverage threshold is configured; avoid reducing coverage and run unit plus e2e suites before opening a PR.

## Commit & Pull Request Guidelines

History currently contains one emoji-prefixed initialization commit, so no mature convention exists. Prefer concise, imperative subjects, optionally scoped, for example `feat(users): add profile mutation` or `fix(auth): reject expired tokens`. Keep commits focused. PRs should explain behavior and schema/config changes, link an issue when available, list verification commands, and include GraphQL examples or screenshots when API behavior is user-visible.

## Security & Configuration

Copy `api/.env.example` locally and provide `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, and `RESEND_EMAIL_FROM`. Never commit `.env`, credentials, generated clients, or production data. Review Prisma migrations before committing and keep secrets out of tests and logs.
