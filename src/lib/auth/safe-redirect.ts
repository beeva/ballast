/**
 * Validates a post-login redirect target from the `from` form field. Never
 * trust it blindly - it round-trips through a query param an attacker
 * fully controls (a crafted /admin/login?from=https://evil.example link),
 * so this rejects anything that isn't a same-origin path under /admin,
 * including protocol-relative URLs (//evil.example, which browsers treat
 * as same-scheme absolute) and a redirect back to the login page itself.
 */
export function safeRedirectTarget(from: string | null | undefined): string {
  if (!from) return "/admin";
  if (!from.startsWith("/") || from.startsWith("//")) return "/admin";
  if (!from.startsWith("/admin")) return "/admin";
  if (from === "/admin/login" || from.startsWith("/admin/login?") || from.startsWith("/admin/login/")) {
    return "/admin";
  }
  return from;
}
