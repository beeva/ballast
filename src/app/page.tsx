export default function HomePage() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="font-display text-4xl font-medium text-iron-50 sm:text-5xl">
        <span className="text-gradient">Ballast</span> is under construction
      </h1>
      <p className="max-w-xl text-iron-300">
        The build runner, deploy pipeline, and observability dashboard are being built in public —
        check back soon.
      </p>
    </main>
  );
}
