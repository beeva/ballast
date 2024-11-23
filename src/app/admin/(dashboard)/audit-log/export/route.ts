import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/current-admin";
import { getAuditLogForExport } from "@/lib/db/queries";
import { auditLogToCsv } from "@/lib/audit/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const rows = await getAuditLogForExport();
  const csv = auditLogToCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ballast-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
