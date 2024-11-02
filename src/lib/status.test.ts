import { describe, expect, it } from "vitest";
import {
  ALERT_STATUS_LABEL,
  ALERT_STATUS_TONE,
  BUILD_STATUS_LABEL,
  BUILD_STATUS_TONE,
  isAlertStatus,
  isBuildStatus,
} from "./status";

describe("isBuildStatus", () => {
  it("accepts every known status", () => {
    for (const status of Object.keys(BUILD_STATUS_LABEL)) {
      expect(isBuildStatus(status)).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(isBuildStatus("cancelled")).toBe(false);
  });

  it("has a tone for every status", () => {
    for (const status of Object.keys(BUILD_STATUS_LABEL)) {
      expect(BUILD_STATUS_TONE[status as keyof typeof BUILD_STATUS_TONE]).toBeDefined();
    }
  });
});

describe("isAlertStatus", () => {
  it("accepts firing and resolved", () => {
    expect(isAlertStatus("firing")).toBe(true);
    expect(isAlertStatus("resolved")).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(isAlertStatus("pending")).toBe(false);
  });

  it("has a tone for every status", () => {
    for (const status of Object.keys(ALERT_STATUS_LABEL)) {
      expect(ALERT_STATUS_TONE[status as keyof typeof ALERT_STATUS_TONE]).toBeDefined();
    }
  });
});
