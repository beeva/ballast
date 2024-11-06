const METRICS = [
  { value: "1", label: "git clone + real build", sub: "not a simulation" },
  { value: "0", label: "mutated rows on rollback", sub: "just a new deploy pointing at an older build" },
  { value: "5s", label: "worker poll interval", sub: "queued builds pick up fast" },
  { value: "$/mo", label: "cost estimate", sub: "from declared resource requests" },
];

export function MetricsBand() {
  return (
    <section className="border-y border-iron-800/60 bg-iron-900/40 py-14">
      <div className="container-page grid grid-cols-2 gap-8 sm:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="text-center sm:text-left">
            <p className="font-display text-3xl text-iron-50 sm:text-4xl">{m.value}</p>
            <p className="mt-1 text-sm text-iron-200">{m.label}</p>
            <p className="text-xs text-iron-400">{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
