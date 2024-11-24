export interface AuditCsvRow {
  createdAt: Date;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
}

/**
 * RFC 4180 field escaping plus CSV formula-injection prevention - a value
 * starting with =, +, -, @, tab, or CR auto-executes as a formula when the
 * file is opened in Excel/Sheets (a real vulnerability class distinct from
 * comma/quote/newline escaping). detail comes from admin-entered fields
 * like an alert rule's metricName, which has no character allowlist, so
 * this isn't a hypothetical input.
 */
function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

const HEADER = ["timestamp", "actor_email", "action", "target_type", "target_id", "detail"];

/** Renders audit log rows as a real CSV document, header row included. */
export function auditLogToCsv(rows: AuditCsvRow[]): string {
  const lines = [HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.createdAt.toISOString(),
        row.actorEmail,
        row.action,
        row.targetType,
        row.targetId ?? "",
        row.detail ?? "",
      ]
        .map(csvField)
        .join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}
