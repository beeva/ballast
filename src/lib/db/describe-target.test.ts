import { describe, expect, it } from "vitest";
import { describeDatabaseTarget } from "./describe-target";

describe("describeDatabaseTarget", () => {
  it("extracts host, port, and db name, never the credentials", () => {
    const summary = describeDatabaseTarget("postgres://ballast:s3cr3t-password@localhost:5432/ballast");
    expect(summary).toBe("localhost:5432/ballast");
    expect(summary).not.toContain("s3cr3t-password");
  });

  it("defaults to port 5432 when the URL omits it", () => {
    expect(describeDatabaseTarget("postgres://user:pass@db.example.com/mydb")).toBe("db.example.com:5432/mydb");
  });

  it("preserves a non-default port", () => {
    expect(describeDatabaseTarget("postgres://user:pass@db.example.com:6543/mydb")).toBe(
      "db.example.com:6543/mydb"
    );
  });

  it("throws on a malformed URL rather than logging something misleading", () => {
    expect(() => describeDatabaseTarget("not-a-url")).toThrow();
  });
});
