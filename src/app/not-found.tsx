import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-sm text-copper-400">404</p>
      <h1 className="font-display text-3xl text-iron-50">Nothing deployed at this address</h1>
      <p className="max-w-sm text-iron-300">
        The page you&apos;re looking for doesn&apos;t exist, or never shipped.
      </p>
      <LinkButton href="/" variant="outline">
        Back home
      </LinkButton>
    </main>
  );
}
