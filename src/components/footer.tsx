import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-iron-800/80">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-iron-400">
          <span className="font-display text-iron-100">Ballast</span>
          <span>— reproducible, boring by design, observable before it&apos;s an incident.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-iron-400">
          <Link href="/docs" className="hover:text-iron-100">
            Docs
          </Link>
          <Link href="/#features" className="hover:text-iron-100">
            Features
          </Link>
          <Link href="/admin/login" className="hover:text-iron-100">
            Admin
          </Link>
          <a
            href="https://github.com/beeva/ballast"
            target="_blank"
            rel="noreferrer"
            className="hover:text-iron-100"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
