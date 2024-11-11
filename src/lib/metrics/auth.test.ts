import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidIngestKey } from "./auth";

describe("isValidIngestKey", () => {
  beforeEach(() => {
    vi.stubEnv("METRICS_INGEST_KEY", "correct-horse-battery-staple");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the correct key with a Bearer prefix", () => {
    expect(isValidIngestKey("Bearer correct-horse-battery-staple")).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(isValidIngestKey(null)).toBe(false);
  });

  it("rejects a header without the Bearer prefix", () => {
    expect(isValidIngestKey("correct-horse-battery-staple")).toBe(false);
  });

  it("rejects the wrong key", () => {
    expect(isValidIngestKey("Bearer wrong-key")).toBe(false);
  });

  it("rejects a key of a different length than configured, without throwing", () => {
    expect(isValidIngestKey("Bearer short")).toBe(false);
    expect(isValidIngestKey("Bearer this-key-is-way-longer-than-the-configured-one")).toBe(false);
  });

  it("fails closed when no key is configured, even with a header present", () => {
    vi.stubEnv("METRICS_INGEST_KEY", "");
    expect(isValidIngestKey("Bearer anything")).toBe(false);
  });
});
