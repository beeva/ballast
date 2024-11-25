# Ballast

A deployment and observability control plane — declare a service, push a build, watch it ship through a real pipeline with a rehearsed rollback, and keep an eye on it with metrics, alerts, and a cost estimate that doesn't wait for the invoice to surprise you.

> Status: the build runner, deploy/rollback (with cancel/retry), metrics/alerting
> (API-key-gated ingestion, optional webhook notifications), cost estimator, a full admin
> dashboard (service create/edit/duplicate/delete, declared env vars, build log viewer, audit
> log), a database-backed health check, a metrics retention script, public status page,
> marketing site, docs, and CI are all built and verified against a real Postgres instance and
> real git/npm builds. See [CHANGELOG.md](./CHANGELOG.md) for the full list.

## Why

Most of the pain in running software isn't the code, it's everything around it: a deploy nobody trusts, an environment that can't be rebuilt, an incident with no data trail, a cloud bill that only makes sense in hindsight. Ballast is built around three ideas:

- **Reproducible** — a service's build and deploy history is a real, queryable record, not tribal knowledge.
- **Boring by design** — releases and rollbacks are the same well-tested path every time, not a special ritual for the risky ones.
- **Observable before it's an incident** — metrics and alerts exist so a problem shows up as a graph, not a page from a customer.

## Planned architecture

- Next.js (App Router) + TypeScript, Tailwind for the app and marketing site
- A real build runner: shells out to actual build commands against a checked-out repo, in an isolated workspace, with captured logs
- Postgres via Drizzle for services, builds, deploys, metrics, and alert state
- A metrics-ingestion API and a threshold-based alert rule evaluator
- A cost estimator from declared per-service resource requests
- An admin dashboard for services, deploy history/rollback, and observability charts

## Roadmap

- [x] Build runner (real command execution, isolated workspace, captured logs)
- [x] Service manifests + deploy/rollback on build history, with build cancel/retry
- [x] Per-service declared env vars, passed to the real build subprocess
- [x] Metrics ingestion (API-key gated) + alert rule evaluation, with optional webhooks
- [x] Cost estimator
- [x] Admin dashboard (service create/edit/duplicate/delete/search, build log viewer, a
      per-service cost breakdown, an audit log with CSV export)
- [x] Metrics retention script + database-backed health check
- [x] Public status page
- [x] Marketing site + docs
- [x] CI

## License

MIT
