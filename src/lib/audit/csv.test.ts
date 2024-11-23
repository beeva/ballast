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
