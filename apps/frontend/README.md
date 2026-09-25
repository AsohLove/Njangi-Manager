# Njangi Manager frontend

The frontend is a Next.js 16 application for treasurers who manage Njangi groups and members who need a public group summary. It uses the App Router, React Query for server state, Axios for API calls, Tailwind CSS utilities, and HTTP-only cookie sessions supplied by the backend.

## Requirements

- Node.js and npm.
- The backend running locally or a deployed Njangi Manager API.

Install dependencies from the repository root or this directory:

```bash
npm install
```

## Configuration

Create `apps/frontend/.env.local` when the API is not at the default address:

```dotenv
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

When the variable is omitted, the client uses `http://localhost:4000/api`.

The Axios client uses `withCredentials: true`, so the backend must allow the frontend origin through credentialed CORS. A production deployment also needs HTTPS because the backend marks cross-origin session cookies as secure.

## Running the application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build:

```bash
npm run build
npm run start
```

Run the configured linter with:

```bash
npm run lint
```

There is currently no frontend test script in `package.json`.

## Routes

### Public routes

| Route | Purpose |
| --- | --- |
| `/login` | Treasurer login form. |
| `/register` | Create a treasurer account. |
| `/members/[code]` | Read-only group summary accessed through a share code; no login is required. |

### Authenticated treasurer routes

The dashboard layout checks `GET /api/groups` before rendering. Failed or expired sessions redirect to `/login`.

| Route | Purpose |
| --- | --- |
| `/` | List the treasurer's groups and create a new group. |
| `/groups/new` | Configure group name, contribution amount, frequency, start date, and payout order. |
| `/groups/[id]` | View the current round, collector, payment progress, positions, and share action. |
| `/groups/[id]/members` | Add or remove members and positions, arrange fixed rotation order, start cycles, and open rounds. |
| `/groups/[id]/members/new` | Add a member with an optional phone number. |
| `/groups/[id]/fines` | View fine rules and fines, create rules, apply fines, and mark fines paid. |
| `/groups/[id]/fund` | View fund balance and history and record spending. |
| `/groups/[id]/ledger` | Review payments, payouts, fines, spending, and adjustments with filters. |
| `/groups/[id]/rounds/[roundId]/close` | Review and close a round, including shortfall acknowledgement. |

## Main user flow

1. Register or log in as a treasurer.
2. Create a group. New groups receive default `Late payment` and `Missed payment` fine rules.
3. Add members and create positions. A member can own multiple positions.
4. Start a cycle. Fixed-order groups require all active positions to have a rotation order; ballot groups can draw a collector.
5. Open rounds and record individual or bulk payments.
6. Use the fines, fund, and ledger screens to maintain the group's financial record.
7. Use the group share action to give members a URL such as `/members/ABC123`.

## Data and API layer

The API wrapper is in `src/lib/api-client.ts`. It provides functions for:

- Authentication and local treasurer display state.
- Groups, members, positions, cycles, rounds, and payments.
- Fine rules, fines, and fine payments.
- Fund spending, ledger entries, and public share data.

React Query hooks in `src/hooks/useCollection.tsx` invalidate related queries after mutations so group, round, fine, and fund screens refresh without a full page reload. A `401` response redirects to login; the displayed treasurer profile is also cached in `localStorage` as `treasurer_user`.

## Project structure

```text
src/
	app/          App Router pages and layouts
	components/   Forms, layout components, and reusable UI
	hooks/        React Query hooks for application operations
	lib/          Axios API client, query client, and utilities
	providers/    React Query provider
	types/        Shared frontend entity and DTO types
```

The root layout loads Geist through `next/font`, applies global styles, and provides the React Query client. The dashboard layout wraps protected pages with `AuthGuard`; group pages additionally render the bottom navigation.

## Related documentation

- [Repository overview](../../README.md)
- [Backend API and database documentation](../backend/README.md)
