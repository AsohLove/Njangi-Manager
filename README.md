# Njangi Manager

Njangi Manager is a web application for running a Njangi, also known as a rotating savings and credit association (ROSCA). A treasurer can configure groups, assign member positions, open contribution rounds, record payments, manage fines and fund activity, and share a read-only group summary with members.

## Repository layout

This repository is an npm workspace containing two applications:

| Directory       | Description                                      | Default URL                 |
| --------------- | ------------------------------------------------ | --------------------------- |
| `apps/backend`  | NestJS REST API backed by PostgreSQL and Prisma  | `http://localhost:4000/api` |
| `apps/frontend` | Next.js web interface for treasurers and members | `http://localhost:3000`     |

The root package has no application scripts. Run commands from the relevant app directory.

## Features

* Treasurer registration, login, logout, and seven-day server-side sessions.
* Group setup with a contribution amount, weekly or monthly frequency, start date, and fixed or ballot payout order.
* Member and position management, including multiple positions for one member.
* Active cycles and contribution rounds with automatic due dates.
* Fixed-order selection, application ballot draws, and manual collector selection through the API.
* Individual and bulk payment recording, partial payments, late-payment tracking, and round closing.
* Configurable fine rules, applied fines, and fine payment tracking.
* Fund balance, adjustments, spending history, and a combined ledger.
* Public, read-only share pages that do not require a member account.

## Prerequisites

* Node.js compatible with the installed Next.js, NestJS, and TypeScript versions.
* npm.
* PostgreSQL.
* A database connection string in `DATABASE_URL`.
* Docker and Docker Compose are optional for running the complete stack in containers.

Install dependencies from the repository root:

```bash
npm install
```

## Local development

Create a `.env` file in the repository root:

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

Do not commit `.env`, `.env.local`, or other environment files containing secrets.

## Docker

The repository includes Docker support for running PostgreSQL, the NestJS backend, and the Next.js frontend together.

From the repository root:

```bash
docker compose up --build
```

The services are available at:

| Service                   | URL                          |
| ------------------------- | ---------------------------- |
| Frontend                  | `http://localhost:3000`      |
| Backend API               | `http://localhost:4000/api`  |
| Swagger API documentation | `http://localhost:4000/docs` |
| PostgreSQL                | `localhost:5432`             |

The Docker Compose setup uses a PostgreSQL health check so the backend waits for the database to become ready before starting. PostgreSQL data is stored in a named Docker volume.

Stop the stack:

```bash
docker compose down
```

Stop the stack and remove the PostgreSQL volume:

```bash
docker compose down -v
```

Docker configuration is provided by:

```text
apps/backend/Dockerfile
apps/frontend/Dockerfile
docker-compose.yml
.dockerignore
```

## API documentation

The NestJS backend exposes interactive OpenAPI/Swagger documentation.

With the backend running, open:

```text
http://localhost:4000/docs
```

The Swagger UI provides an interactive view of the backend API endpoints.

## Continuous Integration

Backend CI is configured in:

```text
.github/workflows/backend-ci.yml
```

The workflow runs for pushes and pull requests targeting `develop` and `main`.

The backend CI workflow:

1. Starts a PostgreSQL 17 service.
2. Installs repository dependencies.
3. Generates the Prisma client.
4. Applies database migrations.
5. Creates the E2E test environment.
6. Runs the backend E2E test suite.
7. Builds the backend.

The E2E suite runs against a real PostgreSQL service and covers important application rules including authentication, ownership, duplicate payments, ballot eligibility, fund balance, round safety, and public share privacy.

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

* [Frontend documentation](apps/frontend/README.md)
* [Backend documentation](apps/backend/README.md)
* [Prisma schema](apps/backend/prisma/schema.prisma)
* [Docker Compose documentation](https://docs.docker.com/compose/)
* [NestJS OpenAPI documentation](https://docs.nestjs.com/openapi/introduction)
