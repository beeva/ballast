export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-iron-700 border-t-copper-500" />
    </div>
  );
}
