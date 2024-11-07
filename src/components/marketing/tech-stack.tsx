const GROUPS = [
  { category: "Build & deploy", items: ["git", "child_process", "Node worker"] },
  { category: "Data", items: ["Postgres", "Drizzle"] },
  { category: "Application", items: ["Next.js", "TypeScript", "Tailwind"] },
  { category: "Platform", items: ["Docker Compose", "GitHub Actions"] },
];

export function TechStack() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <p className="font-mono text-sm text-copper-400">Built with</p>
        <div className="mt-6 flex flex-wrap gap-x-10 gap-y-6">
          {GROUPS.map((g) => (
            <div key={g.category}>
              <p className="text-xs uppercase tracking-wide text-iron-400">{g.category}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-iron-700 bg-iron-900/60 px-3 py-1 text-sm text-iron-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
