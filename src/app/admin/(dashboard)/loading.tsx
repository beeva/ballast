export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-iron-800" />
      <div className="h-4 w-72 animate-pulse rounded-lg bg-iron-800" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-iron-900" />
        ))}
      </div>
    </div>
  );
}
