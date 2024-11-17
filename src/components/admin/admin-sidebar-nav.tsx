"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-iron-800 text-iron-50" : "text-iron-300 hover:bg-iron-800 hover:text-iron-50"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
