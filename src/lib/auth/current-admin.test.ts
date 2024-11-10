import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: getMock }),
}));

const { getCurrentAdmin, requireAdmin } = await import("./current-admin");
const { signSession, SESSION_COOKIE } = await import("./session");

describe("getCurrentAdmin / requireAdmin", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "a-sufficiently-long-test-secret-value");
    getMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getCurrentAdmin returns null with no session cookie", async () => {
    getMock.mockReturnValue(undefined);
    await expect(getCurrentAdmin()).resolves.toBeNull();
  });

  it("getCurrentAdmin returns the session payload for a valid cookie", async () => {
    const token = await signSession({ adminId: "abc-123", email: "admin@example.com" });
    getMock.mockReturnValue({ value: token });
    await expect(getCurrentAdmin()).resolves.toEqual({ adminId: "abc-123", email: "admin@example.com" });
  });

  it("requireAdmin throws with no session cookie - the fix behind every admin server action", async () => {
    getMock.mockReturnValue(undefined);
    await expect(requireAdmin()).rejects.toThrow("Not signed in.");
  });

  it("requireAdmin throws for a forged/garbage cookie value", async () => {
    getMock.mockReturnValue({ value: "not.a.real.jwt" });
    await expect(requireAdmin()).rejects.toThrow("Not signed in.");
  });

  it("requireAdmin resolves the session payload for a valid cookie", async () => {
    const token = await signSession({ adminId: "abc-123", email: "admin@example.com" });
    getMock.mockReturnValue({ value: token });
    await expect(requireAdmin()).resolves.toEqual({ adminId: "abc-123", email: "admin@example.com" });
    expect(getMock).toHaveBeenCalledWith(SESSION_COOKIE.name);
  });
});
