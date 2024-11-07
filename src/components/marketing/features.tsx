import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    title: "A real build runner",
    text: "git clone --depth 1, then your actual build command in a shell - not a mock. A hard timeout and real process-tree termination mean a hung build can't hang the worker.",
  },
  {
    title: "Rollback is just a deploy",
    text: "There's no separate rollback code path to keep in sync - deploying an older build is exactly the same operation, and isRollback is derived, not a flag you have to set.",
  },
  {
    title: "Threshold alerting",
    text: "A rule evaluates the rolling average of a metric over its own window and opens or resolves an incident - a still-breaching rule doesn't spam a new row every tick.",
  },
  {
    title: "A cost estimate that isn't a guess",
    text: "Real per-unit pricing applied to a service's declared CPU/memory request, rolled up across the whole fleet.",
  },
  {
    title: "Full history, nothing mutated",
    text: "Every build and every deploy is its own row. \"What was live at 3pm yesterday\" is always a query away, never a guess.",
  },
  {
    title: "An ingestion API with teeth",
    text: "A batch with even one unknown service slug fails the whole request rather than silently dropping a point - a typo in a metrics agent's config should be loud.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-iron-800/60 py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-xl">
          <p className="font-mono text-sm text-copper-400">Features</p>
          <h2 className="mt-2 font-display text-3xl text-iron-50 sm:text-4xl">
            Built to be trusted with real deploys
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-colors hover:border-copper-500/40">
              <CardTitle>{f.title}</CardTitle>
              <CardDescription className="mt-2">{f.text}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
