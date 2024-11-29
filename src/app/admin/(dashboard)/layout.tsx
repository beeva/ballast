import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { logout } from "../login/actions";

// The whole /admin subtree reads live, auth-gated data - never statically
// prerendered, and never dependent on a database connection at build time.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-shrink-0 border-r border-iron-800 bg-iron-950 px-4 py-6 md:block">
        <Link href="/" className="font-display text-lg text-iron-50">
          Ballast
        </Link>
        <div className="mt-8">
          <AdminSidebarNav />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-iron-800 px-4 sm:px-6">
          <AdminMobileNav />
          <Link href="/admin/account" className="text-sm text-iron-400 hover:text-iron-100">
            {session?.email}
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-iron-300 hover:text-iron-50">
              Sign out
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
