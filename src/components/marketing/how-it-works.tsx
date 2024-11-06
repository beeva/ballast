const STEPS = [
  {
    step: "01",
    title: "Declare",
    text: "Register a service with its repo, build command, and declared CPU/memory - the same shape whether it's a real remote repo or a local one.",
  },
  {
    step: "02",
    title: "Build",
    text: "Trigger a build and the worker actually clones the repo and runs the build command in an isolated workspace, capturing real stdout and stderr on one timeline.",
  },
  {
    step: "03",
    title: "Deploy",
    text: "Deploy any successful build. The previous active deploy is superseded, never deleted - the full history stays queryable.",
  },
  {
    step: "04",
    title: "Watch",
    text: "Send metrics to the ingestion API, set a threshold rule, and let the alert checker open and resolve incidents on its own.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-xl">
          <p className="font-mono text-sm text-copper-400">How it works</p>
          <h2 className="mt-2 font-display text-3xl text-iron-50 sm:text-4xl">
            The whole path from repo to running service
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.step} className="relative">
              <span className="font-display text-3xl text-iron-700">{s.step}</span>
              <h3 className="mt-3 font-display text-lg text-iron-50">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-iron-300">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
