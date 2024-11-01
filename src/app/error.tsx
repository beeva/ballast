"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-sm text-red-400">Something went wrong</p>
      <h1 className="font-display text-2xl text-iron-50">This page hit an unexpected error</h1>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </main>
  );
}
