# Local setup

## 1. Install dependencies

```bash
npm install
```

## 2. Environment

```bash
cp .env.example .env
```

Set a real `SESSION_SECRET` before signing in to `/admin`. `BALLAST_WORKSPACE_DIR` controls
where the build runner checks out repos to build them - the default (`./.ballast/workspaces`)
is fine for local development and is gitignored.

## 3. Database

Start Postgres via Docker:

```bash
npm run db:up
```

Apply the schema, then seed an admin user and two demo services:

```bash
npm run db:migrate
npm run db:seed
```

The seed script prints the admin login it created, and also creates two real local git
repositories under `.ballast/fixture-repos/` so the demo services have something genuine to
build - not stubbed build output.

## 4. Run the app

```bash
npm run dev
```

Sign in at `/admin/login` with the seeded credentials to reach the dashboard.

## 5. Run the build worker

In a second terminal:

```bash
npm run worker:watch
```

Polls for queued builds and actually runs them: a real `git clone` of the service's repo,
then the declared build command, with real stdout/stderr captured to the build's log. Trigger
a build from a service's page in `/admin/services` to see it picked up.

## 6. Run the alert checker

In a third terminal, once you're sending metrics (see `/docs` for the ingestion API):

```bash
npm run alert-check:watch
```

Evaluates every alert rule on an interval and opens or resolves incidents to match - a rule
that's still breaching doesn't open a second incident.

## Useful scripts

| Script                    | What it does                                                |
| -------------------------- | ------------------------------------------------------------- |
| `npm run dev`               | Start the Next.js dev server                                  |
| `npm run build`             | Production build (also runs lint + typecheck)                 |
| `npm run typecheck`         | `tsc --noEmit`                                                 |
| `npm run test`              | Vitest unit tests                                              |
| `npm run db:up`             | Start local Postgres (Docker)                                  |
| `npm run db:generate`       | Generate a Drizzle migration from schema changes                |
| `npm run db:migrate`        | Apply migrations                                                |
| `npm run db:seed`           | Seed an admin user and two demo services                         |
| `npm run worker`            | Process one queued build and exit                                |
| `npm run worker:watch`      | Keep polling for queued builds                                   |
| `npm run alert-check`       | Evaluate all alert rules once and exit                           |
| `npm run alert-check:watch` | Keep polling and evaluating alert rules                          |

## Deploying

The database, worker, alert checker, and app are separate long-lived pieces:

1. Provision Postgres and set `DATABASE_URL`, then run `npm run db:migrate` and
   `npm run db:seed` (or create an admin user directly).
2. Set a real `SESSION_SECRET` and `BALLAST_WORKSPACE_DIR` (somewhere writable and with
   enough disk for repo checkouts).
3. Deploy the Next.js app anywhere that runs a Node server.
4. Run `npm run worker:watch` as a long-lived background process (or on a schedule) - queued
   builds sit untouched until this runs.
5. Run `npm run alert-check:watch` as a long-lived background process - alert rules are
   inert without it, no matter how many metrics come in through `/api/metrics`.
