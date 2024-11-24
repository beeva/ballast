import { describe, expect, it } from "vitest";
import { auditLogToCsv } from "./csv";

describe("auditLogToCsv", () => {
  it("renders a header-only document for an empty list", () => {
    expect(auditLogToCsv([])).toBe("timestamp,actor_email,action,target_type,target_id,detail\r\n");
  });

  it("renders a plain row with no escaping needed", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "service.created",
        targetType: "service",
        targetId: "svc-1",
        detail: "checkout-api",
      },
    ]);
    expect(csv).toBe(
      "timestamp,actor_email,action,target_type,target_id,detail\r\n" +
        "2024-11-23T12:00:00.000Z,admin@example.com,service.created,service,svc-1,checkout-api\r\n"
    );
  });

  it("renders null targetId and detail as empty fields", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "build.triggered",
        targetType: "build",
        targetId: null,
        detail: null,
      },
    ]);
    expect(csv).toContain("build.triggered,build,,\r\n");
  });

  it("quotes and escapes a detail field containing a comma", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "service.updated",
        targetType: "service",
        targetId: "svc-1",
        detail: "renamed from a, b to a-b",
      },
    ]);
    expect(csv).toContain('"renamed from a, b to a-b"');
  });

  it("quotes and double-escapes a detail field containing a literal quote", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "service.updated",
        targetType: "service",
        targetId: "svc-1",
        detail: 'the "prod" service',
      },
    ]);
    expect(csv).toContain('"the ""prod"" service"');
  });

  it.each(["=HYPERLINK(\"http://evil\",\"x\")", "+cmd|' /C calc'!A0", "-2+3", "@SUM(A1:A9)"])(
    "neutralizes a formula-injection payload starting with %s",
    (payload) => {
      const csv = auditLogToCsv([
        {
          createdAt: new Date("2024-11-23T12:00:00.000Z"),
          actorEmail: "admin@example.com",
          action: "alert_rule.created",
          targetType: "alert_rule",
          targetId: null,
          detail: payload,
        },
      ]);
      const detailCell = csv.split("\r\n")[1]!.split(",").slice(5).join(",");
      // A leading ' when opened in a spreadsheet forces text interpretation
      // instead of formula evaluation - the payload's first real character
      // must never be =, +, -, or @ once it lands in the cell.
      expect(detailCell.replace(/^"|"$/g, "")).toMatch(/^'/);
    }
  );

  it("does not alter a detail value that merely contains (not starts with) a formula-like character", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "service.updated",
        targetType: "service",
        targetId: "svc-1",
        detail: "cost = $5/mo",
      },
    ]);
    expect(csv).toContain("cost = $5/mo");
  });

  it("quotes a field containing a newline", () => {
    const csv = auditLogToCsv([
      {
        createdAt: new Date("2024-11-23T12:00:00.000Z"),
        actorEmail: "admin@example.com",
        action: "service.updated",
        targetType: "service",
        targetId: "svc-1",
        detail: "line one\nline two",
      },
    ]);
    expect(csv).toContain('"line one\nline two"');
  });
});
