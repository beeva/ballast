import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies a password against its own hash", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  it("produces a different hash (different salt) for the same password", () => {
    const first = hashPassword("same password");
    const second = hashPassword("same password");
    expect(first).not.toBe(second);
    expect(verifyPassword("same password", first)).toBe(true);
    expect(verifyPassword("same password", second)).toBe(true);
  });

  it("rejects a malformed stored hash instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});
