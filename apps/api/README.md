# MealDeli API

The backend for MealDeli, built with NestJS, Apollo Server, Prisma, and PostgreSQL. It provides the platform's GraphQL contract, real-time order subscriptions, authentication sessions, role authorization, and authenticated media uploads.

[Project overview](../README.md) · [Web app guide](../web/README.md) · [GraphQL schema](./src/schema.gql)

## Features

- Customer, owner, and courier accounts with role-based authorization
- Registration, email verification, login, logout, profile editing, and token refresh
- Short-lived access tokens and revocable refresh sessions
- Restaurant discovery, categories, search, pagination, menu management, and dish options
- Order creation with server-calculated totals and immutable item snapshots
- Role-aware order state machine and courier assignment
- Live pending, ready-for-delivery, and per-order updates over GraphQL subscriptions
- Promotion transaction records with duplicate transaction protection
- Authenticated JPEG, PNG, and WebP uploads to S3-compatible storage
- Prisma migrations, repeatable local seed data, unit tests, and end-to-end tests

## Stack

- NestJS 11 and TypeScript
- Apollo Server, GraphQL, and `graphql-ws`
- Prisma 7 with PostgreSQL
- JWT, Argon2, and class-validator
- Resend for verification email
- AWS SDK for S3-compatible storage
- Jest and Supertest

## Project structure

```text
api/
├── prisma/
│   ├── migrations/           # Versioned database migrations
│   ├── sample_data/          # Local demo fixtures
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Repeatable development seed
├── src/
│   ├── auth/                 # GraphQL and REST guards, roles, current-user helpers
│   ├── common/               # Shared GraphQL output and pagination types
│   ├── generated/prisma/     # Generated Prisma client; do not edit
│   ├── mails/                # Resend integration
│   ├── orders/               # Commands, queries, state machine, subscriptions
│   ├── payments/             # Promotion transactions and webhook placeholder
│   ├── prisma/               # Prisma module and service
│   ├── restaurants/          # Categories, restaurants, menus, and dishes
│   ├── uploads/              # File validation and object storage
│   ├── users/                # Identity, sessions, verification, and profiles
│   ├── app.module.ts         # Root application and GraphQL configuration
│   ├── main.ts               # Bootstrap, validation, and CORS
│   └── schema.gql            # Generated code-first GraphQL schema
└── test/                     # End-to-end tests
```

Feature modules keep their resolver or controller, service, DTOs, entities, and tests together.

## Getting started

### Prerequisites

- A current Node.js LTS release
- pnpm
- PostgreSQL
- S3-compatible object storage
- A Resend API key if verification emails should be delivered

### Installation

```bash
pnpm install
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure `.env`, then prepare and run the application:

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
pnpm start:dev
```

The development API listens on `http://localhost:3000` by default, with GraphiQL at `http://localhost:3000/graphql`.

## Configuration

| Variable | Required | Default or example | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL connection URL |
| `PORT` | No | `3000` | HTTP and WebSocket port |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed credentialed CORS origin and verification-link origin |
| `JWT_ISSUER` | Yes | `meal-deli-api` | JWT issuer claim |
| `JWT_AUDIENCE` | Yes | `meal-deli-client` | JWT audience claim |
| `JWT_ACCESS_SECRET` | Yes | — | HS256 access-token secret |
| `JWT_ACCESS_EXPIRES_IN` | Yes | `15m` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | Yes | — | Independent refresh-token secret |
| `JWT_REFRESH_EXPIRES_IN` | Yes | `1d` | Refresh-token JWT lifetime |
| `JWT_REFRESH_TOKEN_COOKIE` | Yes | `meal_deli_refresh` | HttpOnly refresh cookie name |
| `JWT_REFRESH_TOKEN_TTL_MS` | Yes | `86400000` | Refresh session and cookie lifetime in milliseconds |
| `RESEND_API_KEY` | For email | — | Resend API key |
| `RESEND_EMAIL_FROM` | For email | — | Verified sender address |
| `CATEGORY_PAGE_SIZE` | No | `15` | Category page size |
| `RESTAURANTS_PAGE_SIZE` | No | `15` | Restaurant browse and search page size |
| `PROMOTION_DAYS` | No | `7` | Promotion duration; the current client contract requires exactly 7 |
| `AWS_ENDPOINT_URL_S3` | For custom S3 | — | Custom endpoint, such as MinIO |
| `AWS_ACCESS_KEY_ID` | Yes | — | Object storage access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | — | Object storage secret key |
| `AWS_REGION` | Yes | — | Object storage region |
| `AWS_S3_BUCKET` | Yes | — | Upload destination bucket |
| `PUBLIC_ASSET_BASE_URL` | Recommended | `http://localhost:9000/meal-deli` | Public URL prefix returned for uploaded objects |

Set `NODE_ENV=production` in production so the refresh cookie receives the Secure attribute. Keep access and refresh secrets different.

## Database workflow

### Create a migration

```bash
pnpm exec prisma migrate dev --name <change_name>
pnpm exec prisma generate
```

Review the generated SQL before committing it. Use the following command in deployment environments:

```bash
pnpm exec prisma migrate deploy
```

### Seed local data

```bash
pnpm exec ts-node prisma/seed.ts
```

The seed is repeatable and creates verified users, categories, restaurants, and sample dishes. Development credentials are listed in the [root README](../README.md#demo-accounts).

Prisma generates its client into `src/generated/prisma/`. Never edit that directory manually.

## API surface

### GraphQL

| Transport | Endpoint | Purpose |
| --- | --- | --- |
| HTTP | `/graphql` | Queries, mutations, and GraphiQL |
| WebSocket | `/graphql` | `graphql-ws` subscriptions |

Send the access token with HTTP operations:

```http
Authorization: Bearer <access-token>
```

Send the same credential when opening a WebSocket connection:

```json
{
  "authorization": "Bearer <access-token>"
}
```

Core operations include:

| Domain | Operations |
| --- | --- |
| Identity | `signUp`, `signIn`, `me`, `userProfile`, `editProfile`, `verifyEmail`, `resendVerification`, `signOut`, `refreshAccessToken` |
| Catalog | `allCategories`, `category`, `restaurants`, `restaurant`, `searchRestaurant` |
| Owner management | `myRestaurants`, `myRestaurant`, restaurant CRUD, category CRUD, dish CRUD |
| Orders | `createOrder`, `getOrders`, `getAvailableOrders`, `getOrder`, `editOrder`, `takeOrder` |
| Subscriptions | `orderUpdates`, `pendingOrders`, `cookedOrders` |
| Promotions | `createPayment`, `getPayments` |

The generated [GraphQL schema](./src/schema.gql) is the source of truth for input and output types.

### REST

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Returns `Welcome to MealDeli API!` |
| `POST` | `/uploads` | Bearer token | Uploads one multipart `file` field |
| `POST` | `/payments` | Currently public | Placeholder provider webhook |

The upload endpoint accepts JPEG, PNG, and WebP images up to 5 MiB. It validates the extension, MIME type, and binary signature before storing the object.

Example upload response:

```json
{
  "key": "uploads/<uuid>.webp",
  "url": "https://assets.example.com/uploads/<uuid>.webp"
}
```

The payment REST controller currently logs its input and returns `{ "ok": true }`. It is not a production-ready payment integration.

## Domain model

| Model | Responsibility |
| --- | --- |
| `User` | Identity, role, verification status, and profile |
| `AuthSession` | Hashed refresh token, expiry, usage, and revocation |
| `EmailVerification` | Hashed one-time verification token |
| `Category` | Restaurant classification |
| `Restaurant` | Ownership, category, address, image, and promotion window |
| `Dish` | Menu item, price in minor units, image, and JSON option groups |
| `Order` | Customer, restaurant, courier, total, and current state |
| `OrderItem` | Immutable dish, price, option, quantity, and line-total snapshot |
| `Payment` | Owner promotion transaction for a restaurant |

### Order state machine

Only adjacent transitions are allowed, and each transition belongs to a specific role:

```text
PENDING ──Owner──▶ COOKING ──Owner──▶ WAITING ──Courier──▶ PICKED ──Courier──▶ DELIVERED
```

Authorization and transition rules are enforced by the API, independent of client behavior.

## Authentication flow

1. Sign-up or sign-in returns a short-lived access token.
2. A refresh token is sent in an HttpOnly cookie; only its hash is stored in `AuthSession`.
3. Protected GraphQL and REST operations resolve the current user from the Bearer token.
4. The client requests a new access token through the refresh mutation when needed.
5. Sign-out revokes the server-side session and clears the refresh cookie.

Credentialed cross-origin requests require `FRONTEND_URL` to match the browser origin exactly.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm start:dev` | Start NestJS in watch mode |
| `pnpm start:debug` | Start in debug and watch mode |
| `pnpm build` | Compile the production application |
| `pnpm start:prod` | Run `dist/src/main` |
| `pnpm lint` | Run ESLint with automatic fixes |
| `pnpm format` | Format source and e2e tests with Prettier |
| `pnpm test` | Run Jest unit tests |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:cov` | Generate the Jest coverage report |
| `pnpm test:e2e` | Run Supertest end-to-end tests |

## Testing and quality

Before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Service, resolver, authentication, persistence, and transition changes should cover both success and failure paths. Unit tests live beside the implementation as `*.spec.ts`; end-to-end tests live in `test/`.

## Conventions

- Use strict TypeScript, two-space indentation, single quotes, and trailing commas.
- Name files in kebab case with a role suffix, such as `edit-profile.dto.ts`.
- Keep GraphQL metadata and validation beside their DTO or entity definitions.
- Do not commit secrets, production data, `dist/`, `coverage/`, or generated Prisma client edits.
- After a GraphQL contract change, regenerate the web client with `pnpm codegen` in `../web`.
