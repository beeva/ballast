"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-iron-800/80 bg-iron-950/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-medium text-iron-50">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-copper-500 text-iron-950">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M8 7h8l-2 8h-4L8 7Z" fill="currentColor" />
              <path d="M6 17h12" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </span>
          Ballast
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-iron-300 transition-colors hover:text-iron-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/admin/login" className="hidden text-sm text-iron-300 hover:text-iron-50 sm:block">
            Sign in
          </Link>
          <LinkButton href="/admin" size="sm" className="hidden sm:inline-flex">
            Open dashboard
          </LinkButton>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-iron-200 hover:bg-iron-800 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-iron-800/80 px-6 py-4 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-2 text-sm text-iron-200 hover:bg-iron-800"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/admin/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-2 py-2 text-sm text-iron-200 hover:bg-iron-800"
          >
            Sign in
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-2 py-2 text-sm font-medium text-copper-400 hover:bg-iron-800"
          >
            Open dashboard
          </Link>
        </nav>
      )}
    </header>
  );
}
