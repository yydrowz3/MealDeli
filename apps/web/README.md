# MealDeli Web

The React frontend for MealDeli. It provides responsive, role-specific food delivery experiences for customers, restaurant owners, and couriers, backed by typed GraphQL operations and real-time subscriptions.

[Project overview](../README.md) · [API guide](../api/README.md)

## Features

- Registration, login, verification, session recovery, logout, and profile editing
- Restaurant discovery by category, pagination, and text search
- Dish option selection, persistent cart, address editing, and checkout
- Customer order history, order details, and live status updates
- Owner restaurant and menu management, new-order alerts, kitchen actions, and promotion history
- Courier dispatch board, order claiming, active delivery, history, and route map
- Authentication, verification, and role-aware route gates
- Coordinated token refresh, safe mutation retry rules, and subscription reconnects
- Shared responsive UI primitives, design tokens, loading states, and notifications
- Installable PWA with safe caching boundaries and production update prompts

## Stack

- React 19, TypeScript 6, Vite 8, and React Compiler
- TanStack Router and TanStack Form
- Apollo Client, GraphQL, `graphql-ws`, and GraphQL Code Generator
- Jotai, Zod, and RxJS
- Tailwind CSS, daisyUI, Phosphor Icons, and Sonner
- Leaflet and React Leaflet for maps
- Recharts for owner analytics
- vite-plugin-pwa and Workbox
- Vitest, Testing Library, MSW, and jsdom

## Project structure

```text
web/
├── public/
│   ├── brand/                 # Logo and brand assets
│   └── pwa/                   # Standard and maskable app icons
├── src/
│   ├── app/
│   │   ├── apollo/            # HTTP/WS clients, auth, refresh, and error links
│   │   ├── composition/       # Runtime and route-level composition
│   │   ├── config/            # Validated runtime configuration
│   │   ├── layouts/           # Guest, customer, owner, and courier shells
│   │   ├── providers/         # Application services and React providers
│   │   ├── pwa/               # Registration, caching policy, and updates
│   │   └── routing/           # Authentication and role access policies
│   ├── modules/
│   │   ├── identity/          # Account and profile flows
│   │   ├── catalog/           # Restaurant discovery and details
│   │   ├── checkout/          # Cart and order submission
│   │   ├── orders/            # Order views and subscriptions
│   │   ├── owner-management/  # Restaurants and menus
│   │   ├── owner-insights/    # Dashboard and promotions
│   │   ├── courier/           # Dispatch and delivery workflow
│   │   └── media/             # Image validation, preview, and upload
│   ├── routes/                # TanStack Router file routes
│   ├── shared/ui/             # Tokens, primitives, feedback, and data display
│   ├── gql/                   # Generated GraphQL client artifacts; do not edit
│   ├── routeTree.gen.ts       # Generated route tree; do not edit
│   └── main.tsx               # Application entry point
├── test/                      # Vitest setup and MSW server
├── vite.config.ts             # Vite, Router, React, Tailwind, and PWA config
└── vitest.config.ts           # Test environment and coverage thresholds
```

## Getting started

### Prerequisites

- A current Node.js LTS release
- pnpm
- A running [MealDeli API](../api/README.md)

### Installation

```bash
pnpm install
```

Create `web/.env.local`:

```dotenv
VITE_API_HTTP_URL="http://localhost:3000/graphql"
VITE_API_WS_URL="ws://localhost:3000/graphql"
VITE_APP_ORIGIN="http://localhost:5173"
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:5173`.

The API's `FRONTEND_URL` must match the browser origin exactly. A mismatch prevents credentialed CORS and refresh-cookie requests from succeeding.

## Runtime configuration

The application validates all runtime variables with Zod before it creates Apollo or renders the router. Invalid or missing configuration displays a dedicated startup error page rather than running a partially configured application.

| Variable            | Validation                              | Purpose                        |
| ------------------- | --------------------------------------- | ------------------------------ |
| `VITE_API_HTTP_URL` | Absolute `http://` or `https://` URL    | GraphQL queries and mutations  |
| `VITE_API_WS_URL`   | Absolute `ws://` or `wss://` URL        | GraphQL subscriptions          |
| `VITE_APP_ORIGIN`   | HTTP(S) origin with no application path | Current web application origin |

Use paired `https://` and `wss://` endpoints in production.

## Routes and access

| Route                        | Purpose                                      | Access                                     |
| ---------------------------- | -------------------------------------------- | ------------------------------------------ |
| `/`                          | Product landing page                         | Public                                     |
| `/login`                     | Sign in                                      | Public; authenticated users are redirected |
| `/signup?role=...`           | Registration with optional role preselection | Public                                     |
| `/verify-email`              | Verification and resend flow                 | Authenticated users                        |
| `/profile`                   | User profile                                 | Authenticated users                        |
| `/restaurants/`              | Customer discovery or owner restaurant list  | Customer, owner                            |
| `/restaurants/:restaurantId` | Customer menu or owner overview              | Customer, owner                            |
| `/checkout`                  | Delivery address and order submission        | Verified customer                          |
| `/orders/`                   | Role-specific order list                     | Authenticated users                        |
| `/orders/:orderId`           | Order detail and permitted state actions     | Related order participants                 |
| `/restaurants/new`           | Create a restaurant                          | Verified owner                             |
| `/restaurants/:id/menu`      | Manage dishes and options                    | Verified owner                             |
| `/restaurants/:id/settings`  | Edit restaurant details                      | Verified owner                             |
| `/restaurants/:id/promotion` | Promotion purchase and history               | Verified owner                             |
| `/dashboard`                 | Owner analytics or courier dispatch          | Verified owner or courier                  |
| `/deliveries/:orderId`       | Active delivery and map                      | Verified courier                           |

`PrivateContentGate` centralizes authentication, email-verification, and role checks. These client-side checks improve navigation and feedback; the API remains the security boundary.

## Application architecture

### GraphQL and session handling

Apollo is assembled as a small set of transport and authentication concerns:

1. HTTP operations include the current access token and browser credentials.
2. A session-related GraphQL error enters a coordinated, single-flight refresh flow.
3. Queries are retried after a successful refresh; mutations are retried only when their repository explicitly marks them safe.
4. Subscriptions connect over `graphql-ws` with the Bearer token in connection parameters.
5. Session changes update protected routes and subscription connections.

Feature modules access the network through repositories and adapters. They map generated GraphQL data into domain-focused view models instead of spreading Apollo details throughout components.

### Client state

- Jotai manages session, cart, owner selection, and courier workflow state.
- Cart data is persisted in browser storage and validated with Zod when restored.
- Apollo Client owns remote query state and subscription results.
- Important commands reconcile against authoritative server queries rather than relying solely on optimistic state.
- TanStack Form manages form state; Zod schemas validate external and persisted data boundaries.

### UI system

`src/shared/ui/` contains design tokens and reusable components for buttons, cards, forms, overlays, async states, status badges, dates, money, maps, and charts. Business modules own domain composition and feature-specific styling.

## PWA behavior

- The build emits an installable manifest with standard and maskable icons.
- Navigation requests fall back to `/index.html` for file-based SPA routes.
- GraphQL, upload, authentication, and email-related requests are excluded from general runtime caching.
- Production builds show an application-controlled update prompt.
- Development builds do not register production update UI.

Test PWA installation and update behavior from a production build:

```bash
pnpm build
pnpm preview
```

## GraphQL code generation

Codegen reads `../api/src/schema.gql`, scans `src/**/*.{graphql,gql}`, and writes typed documents to `src/gql/`:

```bash
pnpm codegen
```

Run code generation whenever:

- the backend GraphQL schema changes;
- a frontend `.graphql` operation changes;
- generated artifacts are missing or out of sync after a merge.

Do not edit `src/gql/` manually. TanStack Router also owns `src/routeTree.gen.ts`.

## Media uploads

The media module validates an image locally, previews it, and submits the multipart `file` field to `POST /uploads` with the current access token.

Supported files:

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- Maximum size: 5 MiB

The returned public URL can be saved as a user, restaurant, or dish image.

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start the Vite development server        |
| `pnpm build`         | Type-check and create a production build |
| `pnpm preview`       | Preview the production build locally     |
| `pnpm lint`          | Run Oxlint                               |
| `pnpm test`          | Run Vitest once                          |
| `pnpm test:watch`    | Run Vitest in watch mode                 |
| `pnpm test:coverage` | Generate V8 coverage reports             |
| `pnpm codegen`       | Generate typed GraphQL client artifacts  |

## Testing and quality

The test suite uses:

- Testing Library and user-event for components and pages
- Vitest for domain state, adapters, repositories, and runtime behavior
- MSW for GraphQL and HTTP boundaries
- jsdom as the browser environment

Coverage thresholds are 80% for lines, functions, statements, and branches.

Run the standard review checks:

```bash
pnpm lint
pnpm test
pnpm build
```

Run the coverage suite when changing critical logic:

```bash
pnpm test:coverage
```

## Conventions

- Use strict TypeScript, two-space indentation, and double quotes.
- Keep route files small and place product logic in `src/modules/<feature>/`.
- Store GraphQL documents in each module's `api/` directory and isolate transport details in repositories.
- Add reusable components and tokens to `src/shared/ui/`; keep feature-specific UI in its module.
- Place `*.spec.ts` and `*.spec.tsx` tests close to the code they cover.
- Do not commit `.env.local`, `dist/`, `coverage/`, or manual changes to generated files.

## Troubleshooting

### The startup configuration error page appears

Verify that all three `VITE_*` variables exist, use the required protocols, and that `VITE_APP_ORIGIN` contains only an origin. Restart Vite after changing environment files.

### Login works but session refresh fails

Check that:

- the API `FRONTEND_URL` exactly matches the browser origin;
- `VITE_API_HTTP_URL` points to the API's `/graphql` endpoint;
- credentialed requests are permitted;
- production cookie, HTTPS, and CORS settings agree across both deployments.

### Generated GraphQL types are stale

Update `api/src/schema.gql` by building or starting the API, then run:

```bash
pnpm codegen
```

### Live order updates do not arrive

Confirm that `VITE_API_WS_URL` uses `ws://` or `wss://`, targets the API's `/graphql` endpoint, and that the current account has a valid access token and the appropriate role.
