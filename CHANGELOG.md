# Changelog

## 1.1.0

Follow-up pass after two independent code reviews. Fixed a real double-run race in the
build worker (two concurrent workers could claim and run the same queued build - now an
atomic `FOR UPDATE SKIP LOCKED` claim), a race in `deployBuild` that could leave two
"active" deploys for a service's first-ever deploy, admin server actions that relied solely
on middleware's path matching for auth (Server Actions aren't reliably gated by request path -
every mutation now calls `requireAdmin()` itself), and a git `repoUrl` that could be parsed as
a clone option instead of a repository (`--upload-pack=...`) - closed with the `--` argv
separator. Also fixed the login page inheriting the authenticated dashboard's sidebar chrome
(moved every authenticated route into an `admin/(dashboard)` route group), and a middleware
matcher whose login exclusion matched on string prefix instead of a full path segment.

Added a shared-secret API key requirement on the metrics ingestion endpoint, a recent-metrics
view and a full build-log viewer on the service detail page, an edit page for service
build/resource settings, a delete action for alert rules, and a public `/status` page derived
live from firing alert state.

101 unit tests total, up from 83 - build claiming, deploy locking, requireAdmin, metric
grouping, and ingestion auth all gained direct coverage during this pass.

## 1.0.0

First complete pass: a build runner that actually clones a repo and runs its build command in
an isolated, timeout-enforced workspace (with genuine cross-platform process-tree kill), a
deploy/rollback system where a rollback is just a deploy pointed at an older build, a
metrics-ingestion API with a threshold-based alert evaluator that opens and resolves real
incidents, a cost estimator from declared per-service resource requests, an admin dashboard
(auth, services, deploy history, alert rules), a marketing site, docs, and CI running all of it
against a real Postgres service container.

83 unit tests (auth, rate limiting, the build runner's real git/subprocess behavior, deploy
logic, alert evaluation, cost math, metrics ingestion) verified throughout against both a
mocked database and a real local Postgres instance.
