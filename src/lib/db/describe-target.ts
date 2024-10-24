/**
 * A safe-to-log summary of a Postgres connection string - host, port, and
 * database name, never the credentials. postgres://user:pass@host/db
 * carries the password in plain text, and printing the raw URL in a
 * migration/seed script's startup log is exactly the kind of thing that
 * ends up pasted into a shared CI log or terminal history.
 */
export function describeDatabaseTarget(url: string): string {
  const parsed = new URL(url);
  return `${parsed.hostname}:${parsed.port || 5432}${parsed.pathname}`;
}
