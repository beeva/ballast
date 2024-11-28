# Changelog

## 1.4.0

Alert rules gained the rest of their lifecycle: an edit page (metric/comparator/threshold/
window/webhook, serviceId left immutable same as a service's slug), and a "Test webhook"
button that sends a real `event: "test"` POST through the same `sendAlertWebhook` a live fire
uses, so a broken receiver is caught before it matters instead of during a real incident.
Added a service-scoped alert rules card (with a firing-count badge in the header) to the
service detail page - a service's own page said nothing about its alert status before this.
Added a fleet-wide `/admin/deploys` page - deploy history only existed scoped to one service
before.

Two small real bugs fixed: `Select` (extracted this round from two duplicated inline
`<select>` styles) was missing the `w-full` every other form field has, invisible today only
because both call sites happen to sit in a flex-col label; and `updateService`/
`updateAlertRule` didn't check whether their UPDATE actually matched a row before logging an
audit event and redirecting as success, a narrow TOCTOU gap now guarded with `.returning()`
the same way `cancelQueuedBuild` already was.

152 unit tests total, up from 146. Every feature verified live: a real deploy pushed through
the actual build-and-deploy pipeline and confirmed rendering on the new fleet page, a real
alert fired and confirmed flipping the service page's badge, and the TOCTOU guard proven
against an actually-deleted-mid-flight row, not a hypothetical.

## 1.3.0

Added a real database-backed `/api/health` endpoint, a `/admin/costs` breakdown of the
fleet-wide estimate by service, search on the services list, and a CSV export of the audit
log. `next.config.mjs` now produces a self-contained standalone server build and sends
baseline security headers (no more `X-Powered-By`, plus `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

A fourth independent review pass on that CSV export and the audit log's pagination found two
real bugs before either shipped further: the export only did RFC 4180 delimiter escaping, not
CSV formula-injection prevention (a `detail` value starting with `=`, `+`, `-`, or `@` - an
alert rule's `metricName` has no character allowlist - would auto-execute as a formula when
opened in Excel/Sheets); and pagination cursored on `createdAt` alone, so two audit rows
sharing an exact timestamp could have one silently vanish forever at a page boundary. Both
fixed and verified against real data pulled from the live database, not synthetic cases.

146 unit tests total, up from 126 - env var/audit/CSV edge cases, rate limit window expiry,
and services search all gained direct coverage. Every feature in this pass was verified live:
a real Postgres down/up cycle for the health check, a hand-computed cost cross-check matching
the rendered fleet total to the cent, and a live CSV download with a real comma-containing
field confirmed correctly escaped.

## 1.2.0

A third independent review pass found nothing left to fix - everything below is new
capability, not a bug fix.

Services gained a full lifecycle: delete (cascades to builds/deploys/metrics/alert rules,
verified it doesn't trip the separate `ON DELETE RESTRICT` on `deploys.buildId`), duplicate
(prefills the new-service form from an existing one's config, name/slug deliberately left
blank), and declared env vars (`KEY=VALUE` textarea, passed straight into the real build
subprocess's environment - not the git clone step). A queued build can now be cancelled
before the worker claims it, and a failed one retried with one click. Alert rules gained an
optional webhook URL that gets a real JSON POST on fire and resolve, with its own timeout
and error handling so a dead receiver can't break evaluation for other rules.

Every admin mutation now writes to a new audit log (`/admin/audit-log`, cursor-paginated,
also surfaced as a "recent activity" widget on the overview page) - `targetId` deliberately
isn't a foreign key, so an entry survives deletion of whatever it refers to. Added a real
database-backed `/api/health` endpoint (round-trips a query, doesn't just return a static
200) and a metrics retention script (`npm run prune-metrics`, with `--dry-run`).

Fixed a real accessibility gap found while computing actual WCAG contrast ratios for the
theme: the two most-used muted text colors were failing even the loose 3:1 UI-component
threshold, not just strict body-text AA - lightened both, keeping their relative ordering
intact. Also fixed 7 more instances of a `<button>` nested inside an `<a>` (invalid HTML)
that the same bug, first fixed on one page, turned out to exist on - navbar, hero, CTA band,
404 page, and the services list all had it too.

126 unit tests total, up from 101 - env var parsing, alert webhooks (including a live local
HTTP server actually receiving a POST), audit event recording, and metrics pruning against
seeded old/new data all gained direct coverage. Every feature in this pass was also verified
against the real Postgres instance and a running server, not just its unit tests.

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
