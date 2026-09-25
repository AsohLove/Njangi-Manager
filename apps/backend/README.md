# Njangi Manager backend

The backend is a NestJS REST API for the Njangi Manager application. It uses PostgreSQL through Prisma 7, validates request DTOs with `class-validator`, and authenticates treasurers with server-side sessions stored in the database.

## Requirements and setup

- Node.js and npm.
- PostgreSQL.
- A database created for the application.

Install dependencies from the repository root:

```bash
npm install
```

Create `apps/backend/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/njangi_manager"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
```

`DATABASE_URL` is required by both Prisma and the runtime Prisma adapter. `PORT` defaults to `4000`, and `FRONTEND_URL` defaults to `http://localhost:3000`.

Apply migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

The generated client is placed in `src/generated/prisma`. Do not edit generated files; update `prisma/schema.prisma` and migrations instead.

## Running and testing

Run the API in development watch mode:

```bash
npm run start:dev
```

Other available commands:

```bash
npm run start       # start without watch mode
npm run build       # compile to dist
npm run start:prod  # run dist/main
npm run lint        # ESLint with --fix
npm test            # unit tests
npm run test:watch
npm run test:cov
npm run test:e2e
```

The end-to-end test command uses `.env.test` and runs Prisma migrations through the `pretest:e2e` script. That file must point at a disposable test database before running e2e tests.

## Server behavior

- The global route prefix is `/api`; for example, the health endpoint is `GET /api` and groups are under `/api/groups`.
- CORS allows the configured `FRONTEND_URL` and credentials.
- `cookie-parser` reads the `session_id` cookie.
- `ValidationPipe` strips unknown fields, rejects non-whitelisted fields, transforms primitive values, and returns validation errors for invalid DTOs.
- The global HTTP exception filter normalizes API errors.

Start the API and verify its default route:

```bash
curl http://localhost:4000/api
```

## Authentication

`POST /api/auth/register` creates a treasurer with a bcrypt password hash. `POST /api/auth/login` verifies credentials, creates a database session, and sets an HTTP-only `session_id` cookie. Sessions expire after seven days. `POST /api/auth/logout` deletes the session and clears the cookie.

All application-management endpoints use `AuthGuard`. The guard reads the cookie, rejects missing or expired sessions, and attaches the authenticated user to the request. Services also scope queries by the owner ID, so a treasurer cannot access another treasurer's groups by changing an ID in the URL.

In production, cookies are secure and use `SameSite=None`; use HTTPS when the frontend and API are on different origins.

## API endpoints

All paths below are relative to `/api`. Unless marked **public**, they require the session cookie.

### Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a treasurer. |
| `POST` | `/auth/login` | Public | Log in and set the session cookie. |
| `POST` | `/auth/logout` | Authenticated | Delete the current session. |

### Groups, members, and positions

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/groups` | Create a group and its default fine rules. |
| `GET` | `/groups` | List groups owned by the treasurer. |
| `GET` | `/groups/:id` | Get group details, active cycle, rounds, payments, positions, and fund totals. |
| `POST` | `/groups/:id/share-code` | Regenerate a group's public share code. |
| `POST` | `/groups/:id/members` | Add a member. |
| `DELETE` | `/members/:id` | Delete a member when no active cycle or financial history blocks it. |
| `POST` | `/groups/:id/positions` | Add a position for a group member. |
| `PUT` | `/groups/:id/positions/order` | Set the fixed rotation order. |
| `DELETE` | `/positions/:id` | Delete an unused position or deactivate one with history. |

### Cycles, rounds, and payments

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/groups/:id/cycles` | Start a new cycle. Only one cycle can be active. |
| `GET` | `/cycles/:id/summary` | Get round totals, shortfalls, and cycle fund history. |
| `GET` | `/cycles/:id/eligible-positions` | List positions that have not collected in the cycle. |
| `POST` | `/cycles/:id/rounds` | Open the next round using `auto`, `app_draw`, or `manual_draw`. |
| `GET` | `/rounds/:id` | Get round details. |
| `POST` | `/rounds/:id/close` | Close a round, optionally acknowledging a shortfall. |
| `POST` | `/rounds/:id/payments` | Record one payment. |
| `POST` | `/rounds/:id/payments/bulk` | Record payments for all unpaid positions belonging to a member. |
| `PATCH` | `/payments/:id` | Add or update payment amount. |

Group creation accepts `name`, a positive `amount`, `frequency` (`weekly` or `monthly`), an ISO `start_date`, and `order_mode` (`fixed` or `ballot`). Fixed-order cycles require every active position to have an order. Ballot cycles choose an eligible collector by application draw or manual selection.

### Fines, fund, adjustments, and ledger

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/groups/:id/fine-rules` | List fine rules. |
| `POST` | `/groups/:id/fine-rules` | Create a fine rule. |
| `PATCH` | `/fine-rules/:id` | Update a fine rule. |
| `DELETE` | `/fine-rules/:id` | Delete an unused fine rule. |
| `GET` | `/groups/:id/fines` | List group fines. |
| `POST` | `/groups/:id/fines` | Apply a fine to a member. |
| `POST` | `/fines/:id/pay` | Mark a fine as paid. |
| `GET` | `/groups/:id/fund` | Get fund balance and history. |
| `POST` | `/groups/:id/fund/spending` | Record a fund expense. |
| `POST` | `/groups/:id/adjustments` | Add a financial adjustment. |
| `GET` | `/groups/:id/ledger` | Get newest-first payments, payouts, fines, spending, and adjustments. |
| `GET` | `/groups/:id/members/:memberId/summary` | Get a member's payments, collections, fines, and positions. |

### Public sharing

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/share/:code` | Public | Return a read-only group summary, current round progress, positions, and owed fines. |

## Database model

The Prisma schema models the following relationships:

- `User` owns `Group` records and has `Session` records.
- `Group` contains `Member`, `Position`, `Cycle`, `FineRule`, `Fine`, `FundSpending`, and `Adjustment` records.
- `Cycle` contains ordered `Round` records.
- A `Round` has a collector position, `Payment` records, an optional `Payout`, fines, and adjustments.
- `Position` connects a member to a group and can retain historical payments and payouts after being deactivated.

The fund balance is calculated as paid fines plus fund adjustments minus fund spending. Payment amounts are stored as integer values, represented in the frontend as FCFA/XAF amounts.

## Project structure

```text
src/
  auth/              Registration, login, sessions, and AuthGuard
  groups/            Group, member, and position setup
  cycles/            Cycle creation and summaries
  rounds/            Round selection, details, and closing
  payments/          Individual and bulk payments
  fines/             Fine rules and fine records
  fund/              Fund balance and spending
  adjustments/       Group/member/round adjustments
  ledger/            Unified financial history
  member-summary/    Treasurer-only member summaries
  share/             Public share endpoint
  prisma/            Prisma service and module
  generated/prisma/  Generated Prisma client
```

## Related documentation

- [Repository overview](../../README.md)
- [Frontend documentation](../frontend/README.md)
- [Prisma schema](prisma/schema.prisma)