import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession, verifySession } from "./session";

describe("session", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "a-sufficiently-long-test-secret-value");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a valid session", async () => {
    const token = await signSession({ adminId: "abc-123", email: "admin@example.com" });
    const payload = await verifySession(token);
    expect(payload).toEqual({ adminId: "abc-123", email: "admin@example.com" });
  });

  it("rejects a garbage token", async () => {
    const payload = await verifySession("not.a.jwt");
    expect(payload).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession({ adminId: "abc-123", email: "admin@example.com" });
    vi.stubEnv("SESSION_SECRET", "a-completely-different-test-secret");
    const payload = await verifySession(token);
    expect(payload).toBeNull();
  });

  it("throws when SESSION_SECRET is missing", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    await expect(signSession({ adminId: "abc-123", email: "admin@example.com" })).rejects.toThrow(
      /SESSION_SECRET/
    );
  });
});
