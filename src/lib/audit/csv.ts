export interface AuditCsvRow {
  createdAt: Date;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
}

/** RFC 4180 field escaping - quote and double-escape only when actually needed. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
