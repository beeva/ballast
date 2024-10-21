# Ballast

A deployment and observability control plane — declare a service, push a build, watch it ship through a real pipeline with a rehearsed rollback, and keep an eye on it with metrics, alerts, and a cost estimate that doesn't wait for the invoice to surprise you.

> Status: early scaffold. See the [roadmap](#roadmap) below.

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

- [ ] Build runner (real command execution, isolated workspace, captured logs)
- [ ] Service manifests + deploy/rollback on build history
- [ ] Metrics ingestion + alert rule evaluation
- [ ] Cost estimator
- [ ] Admin dashboard
- [ ] Marketing site
- [ ] CI

## License

MIT
