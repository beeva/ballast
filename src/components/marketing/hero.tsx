import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid-fade pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="container-page flex flex-col items-center text-center">
        <Badge tone="copper" className="animate-fade-up">
          Real build runner &middot; deploy/rollback &middot; metrics &amp; alerts
        </Badge>

        <h1
          className="mt-6 max-w-3xl animate-fade-up font-display text-4xl font-medium leading-tight text-iron-50 sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Deployments that stay <span className="text-gradient">boring</span>
        </h1>

        <p
          className="mt-6 max-w-xl animate-fade-up text-lg text-iron-300"
          style={{ animationDelay: "160ms" }}
        >
          Ballast clones your repo, runs your build for real, and gives every deploy a rehearsed
          rollback - one query away, no special ritual for the risky ones.
        </p>

        <div
          className="mt-10 flex animate-fade-up flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <LinkButton href="/admin" size="lg">
            Open the dashboard
          </LinkButton>
          <LinkButton href="#how-it-works" size="lg" variant="outline">
            How it works
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
