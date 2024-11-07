import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CTABand() {
  return (
    <section className="border-t border-iron-800/60 py-24">
      <div className="container-page flex flex-col items-center gap-6 rounded-3xl border border-iron-700 bg-gradient-to-b from-iron-900 to-iron-950 px-6 py-16 text-center shadow-panel">
        <Badge tone="moss">Verified against a real Postgres instance and real builds</Badge>
        <h2 className="max-w-lg font-display text-3xl text-iron-50 sm:text-4xl">
          Declare a service and watch it actually build
        </h2>
        <p className="max-w-md text-iron-300">
          Every action in the dashboard is exactly what really happened - a real clone, a real
          build, a real deploy, never a placeholder.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/admin">
            <Button size="lg">Open the dashboard</Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline">
              Read the docs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
