<p align="center">
  <img src="./web/public/brand/mealdeli-logo-primary.svg" alt="MealDeli" width="280" />
</p>

<p align="center">
  A **full-stack**, real-time meal delivery platform for customers, restaurant owners, and couriers.
</p>

<p align="center">
  <a href="./api/README.md">API documentation</a>
  ·
  <a href="./web/README.md">Web documentation</a>
  <!-- ·
  <a href="./docs/detailed-designs/00-architecture.md">Architecture</a>
  ·
  <a href="./docs/tasks/progress.md">Implementation status</a> -->
</p>

<p align="center">
  <a href="https://mealdeli.onrender.com">
  <img alt="live-demo-badge" src="https://img.shields.io/badge/Live Demo-Render-000000?logo=render" />
  </a>
</p>

<p align="center">
<img alt="NestJS" src="https://img.shields.io/badge/-NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
<img alt="GraphQL" src="https://img.shields.io/badge/-GraphQL-E10098?style=flat-square&logo=graphql&logoColor=white" />
<img alt="Prisma" src="https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" />
<img alt="PostgreSQL" src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
<img alt="React" src="https://img.shields.io/badge/-React-45b8d8?style=flat-square&logo=react&logoColor=white" />
<img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" />
<img alt="TailwindCSS" src="https://img.shields.io/badge/-Tailwind CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
<img alt="Node.js" src="https://img.shields.io/badge/-Node.js-5fa04e?style=flat-square&logo=node.js&logoColor=white" />
</p>

<p align="center">
<img alt="Apollo" src="https://img.shields.io/badge/-Apollo-311C87?style=flat-square&logo=apollographql&logoColor=white" />
<img alt="DaisyUI" src="https://img.shields.io/badge/-DaisyUI-FFC63A?style=flat-square&logo=daisyui&logoColor=white" />
<img alt="Vite" src="https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=Vite&logoColor=white" />
<img alt="Vitest" src="https://img.shields.io/badge/-Vitest-6E9F18?style=flat-square&logo=Vitest&logoColor=white" />
<img alt="Testing Library" src="https://img.shields.io/badge/-Testing Library-E33332?style=flat-square&logo=testinglibrary&logoColor=white" />
<img alt="Neon" src="https://img.shields.io/badge/-Neon-34D59A?style=flat-square&logo=neon&logoColor=white" />
<img alt="Resend" src="https://img.shields.io/badge/-Resend-025E8C?style=flat-square&logo=resend&logoColor=white" />
<img alt="Oxc" src="https://img.shields.io/badge/-Oxc-00F7F1?style=flat-square&logo=oxc&logoColor=white" />

</p>

## Overview

MealDeli is a role-based full-stack meal delivery application built as two separate backend & frontend node projects.

⚡ [**NestJS**](https://nestjs.com/) for the Node.js based backend system. The NestJS backend exposes a GraphQL API, **real-time subscriptions**, and authenticated image uploads.

🚀 [**React**](https://react.dev/) for the frontend system. The React frontend delivers **responsive** customer, owner, and courier experiences as an installable PWA.

The project includes the complete delivery lifecycle—from restaurant discovery and checkout to kitchen preparation, courier assignment, and final delivery.

## Highlights

- Three purpose-built experiences for **customers**, restaurant **owners**, and **couriers**
- JWT access tokens with rotating server-side **refresh** sessions
- Real-time order updates over `graphql-ws`
- Strict server-side order state transitions and **role authorization**
- Restaurant, menu, dish option, image, and promotion management
- PostgreSQL persistence with reviewed Prisma migrations
- **S3**-compatible image storage and **Resend** email verification
- Installable PWA with safe runtime caching and update prompts
- Typed **GraphQL** operations generated from the backend schema
- Unit, integration, and end-to-end test coverage across both applications

## Product experiences

| Role     | Capabilities                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer | Discover restaurants, search by category or name, customize dishes, manage a cart, place orders, and follow live order progress               |
| Owner    | Create restaurants, manage menus, receive incoming orders, advance kitchen states, review activity, and purchase restaurant promotion periods |
| Courier  | Browse available deliveries, claim an order, follow the delivery route, advance delivery states, and review delivery history                  |

## Tech stack

| Area          | Technologies                                                                            |
| ------------- | --------------------------------------------------------------------------------------- |
| Web           | React 19, TypeScript, Vite 8, TanStack Router, TanStack Form, Apollo Client, Jotai, Zod |
| UI            | Tailwind CSS, daisyUI, Phosphor Icons, Leaflet, Recharts, Sonner                        |
| API           | NestJS 11, Apollo Server, GraphQL, graphql-ws, class-validator                          |
| Data and auth | PostgreSQL, Prisma 7, JWT, Argon2                                                       |
| Integrations  | Resend, S3-compatible object storage                                                    |
| Testing       | Jest, Supertest, Vitest, Testing Library, MSW                                           |

## Architecture

```text
Browser / installed PWA
        │
        ├── GraphQL HTTP ────── queries and mutations
        ├── GraphQL WebSocket ─ live order subscriptions
        └── REST multipart ──── authenticated image uploads
        │
NestJS API
        ├── JWT and role guards
        ├── application services and order state machine
        ├── Prisma ──────────── PostgreSQL
        ├── Resend ──────────── verification email
        └── AWS SDK ─────────── S3-compatible storage
```

Authentication uses a short-lived access token in the Authorization header and a refresh token in an HttpOnly cookie. The refresh token is hashed in a server-side session, allowing logout and session revocation without storing raw refresh credentials.

## Repository layout

```text
MealDeli/
├── api/                     # NestJS GraphQL API
│   ├── prisma/              # Schema, migrations, seed script, and sample data
│   ├── src/                 # Feature modules and generated GraphQL schema
│   └── test/                # End-to-end tests
├── web/                     # React PWA
│   ├── public/              # Brand assets and PWA icons
│   ├── src/app/             # Runtime composition, routing, Apollo, and PWA
│   ├── src/modules/         # Domain-focused product features
│   ├── src/routes/          # TanStack Router file routes
│   └── src/shared/ui/       # Design tokens and reusable UI
└── docs/                    # Proposals, detailed designs, and delivery plans
```

The repository does not have a root `package.json`. Install dependencies and run commands inside `api/` and `web/` independently.

## Getting started

### Prerequisites

- Node.js
- pnpm
- PostgreSQL
- S3-compatible object storage, such as AWS S3 or MinIO
- A Resend API key if verification emails should be delivered

### 1. Configure the API

```bash
cd api
pnpm install
cp .env.example .env
```

PowerShell users can copy the file with:

```powershell
Copy-Item .env.example .env
```

At minimum, configure the database, frontend origin, JWT secrets, and object storage in `api/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meal_deli"
FRONTEND_URL="http://localhost:5173"
PORT=3000

JWT_ISSUER="meal-deli-api"
JWT_AUDIENCE="meal-deli-client"
JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
JWT_REFRESH_EXPIRES_IN="1d"
JWT_REFRESH_TOKEN_COOKIE="meal_deli_refresh"
JWT_REFRESH_TOKEN_TTL_MS=86400000
```

Apply migrations, generate the Prisma client, optionally seed demo data, and start the API:

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
pnpm exec ts-node prisma/seed.ts
pnpm start:dev
```

The API is now available at:

- GraphQL and GraphiQL: `http://localhost:3000/graphql`
- GraphQL subscriptions: `ws://localhost:3000/graphql`
- Health response: `http://localhost:3000/`

See the [API guide](./api/README.md) for the complete environment reference, data model, and endpoint documentation.

### 2. Configure the web app

Open another terminal:

```bash
cd web
pnpm install
```

Create `web/.env.local`:

```dotenv
VITE_API_HTTP_URL="http://localhost:3000/graphql"
VITE_API_WS_URL="ws://localhost:3000/graphql"
VITE_APP_ORIGIN="http://localhost:5173"
```

Start Vite:

```bash
pnpm dev
```

Open `http://localhost:5173`. See the [web guide](./web/README.md) for route permissions, application architecture, PWA behavior, and troubleshooting.

## Demo accounts

Running `pnpm exec ts-node prisma/seed.ts` inside `api/` creates the following verified development accounts:

| Role                    | Email                     | Password           |
| ----------------------- | ------------------------- | ------------------ |
| Customer                | `customer@mealdeli.com`   | `passwordcustomer` |
| Owner                   | `owner@mealdeli.com`      | `passwordowner`    |
| Courier                 | `courier@mealdeli.com`    | `passwordcourier`  |
| Sample restaurant owner | `test_owner@mealdeli.com` | `test_owner`       |

These credentials are for local development only. Never reuse them in a public or production environment.

## Order lifecycle

Orders follow a strictly adjacent state machine. The API rejects skipped states and transitions attempted by the wrong role.

```text
PENDING ──Owner──▶ COOKING ──Owner──▶ WAITING ──Courier──▶ PICKED ──Courier──▶ DELIVERED
```

Order items preserve dish names, prices, selected options, and totals as snapshots. Later menu edits therefore do not alter historical orders.

## Development commands

Run each command from the relevant project directory.

| Task               | `api/`                      | `web/`               |
| ------------------ | --------------------------- | -------------------- |
| Development server | `pnpm start:dev`            | `pnpm dev`           |
| Production build   | `pnpm build`                | `pnpm build`         |
| Lint               | `pnpm lint`                 | `pnpm lint`          |
| Unit tests         | `pnpm test`                 | `pnpm test`          |
| Coverage           | `pnpm test:cov`             | `pnpm test:coverage` |
| End-to-end tests   | `pnpm test:e2e`             | —                    |
| Generated types    | `pnpm exec prisma generate` | `pnpm codegen`       |

When the GraphQL schema or a frontend `.graphql` document changes, regenerate the web client artifacts:

```bash
cd web
pnpm codegen
```

Do not manually edit `api/src/generated/prisma/`, `web/src/gql/`, or `web/src/routeTree.gen.ts`.

## Verification before review

```bash
cd api
pnpm lint
pnpm test
pnpm test:e2e
pnpm build

cd ../web
pnpm lint
pnpm test
pnpm build
```

For database changes, inspect the generated migration SQL before committing it. For UI changes, include screenshots in the pull request; for API changes, include representative GraphQL operations.

## Production notes

- Use HTTPS and WSS everywhere, with separate high-entropy access and refresh secrets.
- Set `NODE_ENV=production` so refresh cookies receive the Secure attribute.
- Match `FRONTEND_URL` exactly to the deployed web origin for credentialed CORS requests.
- Keep the S3 bucket private for writes and expose assets through a controlled public base URL or CDN.
- Run `prisma migrate deploy` rather than development migrations during deployment.
- `POST /payments` is currently a provider webhook placeholder. Add signature verification, idempotency, and audited event handling before production use.
- Never commit `.env` files, credentials, production data, generated build output, or coverage reports.

## Documentation

- [API reference and development guide](./api/README.md)
- [Web architecture and development guide](./web/README.md)
- [System architecture](./docs/detailed-designs/00-architecture.md)
- [Feature implementation status](./docs/tasks/progress.md)

## License

This Project is licensed as `MIT License`, refer to `LICENSE.md` for more information.

Copyright © 2026 [MealDeli](https://github.com/yydrowz3/mealdeli).
