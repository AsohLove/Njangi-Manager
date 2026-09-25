# Njangi Manager

Njangi Manager is a web application for running a Njangi, also known as a rotating savings and credit association (ROSCA). A treasurer can configure groups, assign member positions, open contribution rounds, record payments, manage fines and fund activity, and share a read-only group summary with members.

## Repository layout

This repository is an npm workspace containing two applications:

| Directory | Description | Default URL |
| --- | --- | --- |
| `apps/backend` | NestJS REST API backed by PostgreSQL and Prisma | `http://localhost:4000/api` |
| `apps/frontend` | Next.js web interface for treasurers and members | `http://localhost:3000` |

The root package has no application scripts. Run commands from the relevant app directory.

## Features

- Treasurer registration, login, logout, and seven-day server-side sessions.
- Group setup with a contribution amount, weekly or monthly frequency, start date, and fixed or ballot payout order.
- Member and position management, including multiple positions for one member.
- Active cycles and contribution rounds with automatic due dates.
- Fixed-order selection, application ballot draws, and manual collector selection through the API.
- Individual and bulk payment recording, partial payments, late-payment tracking, and round closing.
- Configurable fine rules, applied fines, and fine payment tracking.
- Fund balance, adjustments, spending history, and a combined ledger.
- Public, read-only share pages that do not require a member account.

## Prerequisites

- Node.js compatible with the installed Next.js, NestJS, and TypeScript versions.
- npm.
- PostgreSQL.
- A database connection string in `DATABASE_URL`.

Install dependencies from the repository root:

```bash
npm install
```

## Local development

Create `apps/backend/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/njangi_manager"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
```

Apply migrations and generate the Prisma client:

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

Start the API:

```bash
cd apps/backend
npm run start:dev
```

Create `apps/frontend/.env.local` only when the API is not at its default address:

```dotenv
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

Start the web application in another terminal:

```bash
cd apps/frontend
npm run dev
```

Open `http://localhost:3000`. Register a treasurer, create a group, add members and positions, then start a cycle before opening rounds.

## Application workflow

1. Register or log in as a treasurer.
2. Create a group and choose its contribution amount, frequency, start date, and payout order.
3. Add members and create one or more positions for each member.
4. For fixed order, assign every active position a rotation order. For ballot order, use an application draw or a manual draw.
5. Start a cycle, open rounds, and record contributions.
6. Close each round after collecting payments. A shortfall must be acknowledged when required by the backend.
7. Apply and collect fines, record fund spending or adjustments, and review the ledger.
8. Share `/members/<share-code>` with members. This page is public and read-only.

## Authentication and API conventions

The backend is served under the `/api` global prefix. Login creates a `session_id` HTTP-only cookie valid for seven days. Authenticated endpoints require that cookie and scope data access to the logged-in treasurer's groups. The frontend sends credentials with requests and redirects to `/login` after a `401` response.

In production, configure `FRONTEND_URL` to the exact frontend origin. Because the API enables credentialed CORS, the origin must not be an unrestricted wildcard. Production cookies use `secure` and `SameSite=None`, so HTTPS is required for cross-origin deployment.

## Useful commands

Backend commands are documented in [apps/backend/README.md](apps/backend/README.md), and frontend commands and routes are documented in [apps/frontend/README.md](apps/frontend/README.md).

```bash
# Backend
cd apps/backend
npm run build
npm test
npm run test:e2e

# Frontend
cd apps/frontend
npm run lint
npm run build
npm run start
```

## Further reading

- [Frontend documentation](apps/frontend/README.md)
- [Backend documentation](apps/backend/README.md)
- [Prisma schema](apps/backend/prisma/schema.prisma)