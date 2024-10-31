import { describe, expect, it } from "vitest";
import { safeRedirectTarget } from "./safe-redirect";

describe("safeRedirectTarget", () => {
  it("allows a same-origin admin path", () => {
    expect(safeRedirectTarget("/admin/services/42")).toBe("/admin/services/42");
  });

  it("defaults to /admin for null, undefined, or empty", () => {
    expect(safeRedirectTarget(null)).toBe("/admin");
    expect(safeRedirectTarget(undefined)).toBe("/admin");
    expect(safeRedirectTarget("")).toBe("/admin");
  });

  it("rejects an absolute URL to another origin", () => {
    expect(safeRedirectTarget("https://evil.example/phish")).toBe("/admin");
  });

  it("rejects a protocol-relative URL", () => {
    expect(safeRedirectTarget("//evil.example/phish")).toBe("/admin");
  });

  it("rejects a path outside /admin", () => {
    expect(safeRedirectTarget("/")).toBe("/admin");
    expect(safeRedirectTarget("/api/metrics")).toBe("/admin");
  });

  it("rejects a redirect back to the login page itself", () => {
    expect(safeRedirectTarget("/admin/login")).toBe("/admin");
    expect(safeRedirectTarget("/admin/login?from=%2Fadmin")).toBe("/admin");
  });
});
