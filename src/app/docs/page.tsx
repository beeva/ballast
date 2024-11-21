import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Docs",
  description: "Ballast's core operations and the metrics ingestion API.",
};

const OPERATIONS: Array<{ title: string; text: string }> = [
  {
    title: "Trigger a build",
    text: "From a service's page, click Trigger build - this inserts a queued row and returns immediately. The worker (npm run worker:watch) picks it up on its own poll and runs the real build.",
  },
  {
    title: "Deploy a build",
    text: "Only a successful, not-currently-live build shows a Deploy button. Deploying supersedes whatever was active - nothing is deleted, so the full history stays queryable.",
  },
  {
    title: "Roll back",
    text: "There's no separate rollback action - deploying an older build is exactly the same operation. isRollback is derived from whether that build was already live before, not a flag you set.",
  },
  {
    title: "Alerting",
    text: "An alert rule averages a metric over its own window and compares it to a threshold. The alert checker (npm run alert-check:watch) opens or resolves an incident to match - a still-breaching rule doesn't open a second one. An optional webhook URL gets a real JSON POST (event, ruleId, serviceId, metricName, comparator, threshold, currentValue, occurredAt) on every fire and resolve.",
  },
  {
    title: "Env vars and duplicating a service",
    text: "A service can declare KEY=VALUE env vars, passed straight into the real build subprocess's environment. Duplicate on a service's page prefills a new-service form from its current config - name and slug are left blank on purpose, since those are exactly what makes it a separate service.",
  },
];

const SNIPPET = `curl -X POST https://your-ballast-domain.example/api/metrics \\
  -H "Authorization: Bearer $METRICS_INGEST_KEY" \\
  -H "Content-Type: application/json" \\
  -d '[
    {"serviceSlug":"checkout-api","metricName":"latency_ms","value":142},
    {"serviceSlug":"checkout-api","metricName":"error_rate","value":0.4}
  ]'`;

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="container-page py-16">
        <h1 className="font-display text-3xl text-iron-50">How Ballast works</h1>
        <p className="mt-3 max-w-2xl text-iron-300">
          The dashboard is a thin view over a few real operations - nothing here is simulated.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {OPERATIONS.map((op) => (
            <Card key={op.title}>
              <CardTitle>{op.title}</CardTitle>
              <CardDescription className="mt-2">{op.text}</CardDescription>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl text-iron-50">Sending metrics</h2>
          <p className="mt-2 max-w-2xl text-sm text-iron-300">
            <code className="rounded bg-iron-800 px-1.5 py-0.5">POST /api/metrics</code> accepts a single
            point or a batch of up to 500. A batch with even one unknown service slug fails the whole
            request - a typo&apos;d slug shouldn&apos;t silently vanish. Requires an{" "}
            <code className="rounded bg-iron-800 px-1.5 py-0.5">Authorization: Bearer</code> header
            matching the deployment&apos;s <code className="rounded bg-iron-800 px-1.5 py-0.5">METRICS_INGEST_KEY</code>.
          </p>
          <pre className="scrollbar-thin mt-4 max-w-2xl overflow-x-auto rounded-lg bg-iron-950 p-4 font-mono text-sm text-copper-400">
            {SNIPPET}
          </pre>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl text-iron-50">Health check</h2>
          <p className="mt-2 max-w-2xl text-sm text-iron-300">
            <code className="rounded bg-iron-800 px-1.5 py-0.5">GET /api/health</code> actually round-trips a
            query to Postgres rather than returning a static 200 - point a load balancer or orchestrator&apos;s
            liveness check at it and it&apos;ll correctly report unhealthy if the database is unreachable, not
            just if the app process crashed.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
