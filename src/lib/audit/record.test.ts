import { describe, expect, it } from "vitest";
import { recordAuditEvent, type Db } from "./record";

function makeFakeDb() {
  const inserted: Record<string, unknown>[] = [];
  const db = {
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        inserted.push(values);
        return Promise.resolve();
      },
    }),
  } as unknown as Db;
  return { db, inserted };
}

describe("recordAuditEvent", () => {
  it("writes a row with the given fields", async () => {
    const { db, inserted } = makeFakeDb();
    await recordAuditEvent(db, {
      actorEmail: "admin@example.com",
      action: "service.created",
      targetType: "service",
      targetId: "svc-1",
      detail: "checkout-api",
    });
    expect(inserted).toEqual([
      {
        actorEmail: "admin@example.com",
        action: "service.created",
        targetType: "service",
        targetId: "svc-1",
        detail: "checkout-api",
      },
    ]);
  });

  it("defaults targetId and detail to null when omitted", async () => {
    const { db, inserted } = makeFakeDb();
    await recordAuditEvent(db, { actorEmail: "admin@example.com", action: "alert_rule.created", targetType: "alert_rule" });
    expect(inserted[0]).toMatchObject({ targetId: null, detail: null });
  });
});
