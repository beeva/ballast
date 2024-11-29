import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_LABEL } from "./labels";

// Every action string recordAuditEvent is actually called with across
// src/app/admin/(dashboard)/services/actions.ts, .../alerts/actions.ts, and
// .../account/actions.ts - kept in sync by hand, but this test at least
// fails loudly if a future action string is added there without a matching
// label here, rather than the audit log silently falling back to the raw
// action string.
const KNOWN_ACTIONS = [
  "service.created",
  "service.updated",
  "service.deleted",
  "build.triggered",
  "build.cancelled",
  "deploy.created",
  "deploy.rolled_back",
  "alert_rule.created",
  "alert_rule.updated",
  "alert_rule.deleted",
  "admin.password_changed",
];

describe("AUDIT_ACTION_LABEL", () => {
  it("has a label for every known audit action", () => {
    for (const action of KNOWN_ACTIONS) {
      expect(AUDIT_ACTION_LABEL[action]).toBeDefined();
    }
  });

  it("has no stray keys beyond the known action list", () => {
    expect(Object.keys(AUDIT_ACTION_LABEL).sort()).toEqual([...KNOWN_ACTIONS].sort());
  });
});
