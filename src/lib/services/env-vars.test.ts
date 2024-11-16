import { describe, expect, it } from "vitest";
import { formatEnvVarsText, parseEnvVarsText } from "./env-vars";

describe("parseEnvVarsText", () => {
  it("parses simple KEY=VALUE lines", () => {
    const result = parseEnvVarsText("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ ok: true, vars: { FOO: "bar", BAZ: "qux" } });
  });

  it("returns an empty object for empty input", () => {
    expect(parseEnvVarsText("")).toEqual({ ok: true, vars: {} });
  });

  it("skips blank lines and comment lines", () => {
    const result = parseEnvVarsText("FOO=bar\n\n# a comment\nBAZ=qux\n");
    expect(result).toEqual({ ok: true, vars: { FOO: "bar", BAZ: "qux" } });
  });

  it("allows an empty value", () => {
    expect(parseEnvVarsText("FOO=")).toEqual({ ok: true, vars: { FOO: "" } });
  });

  it("preserves '=' characters within the value", () => {
    expect(parseEnvVarsText("CONNECTION=key=value&other=1")).toEqual({
      ok: true,
      vars: { CONNECTION: "key=value&other=1" },
    });
  });

  it("trims whitespace around keys and values", () => {
    expect(parseEnvVarsText("  FOO  =  bar  ")).toEqual({ ok: true, vars: { FOO: "bar" } });
  });

  it("rejects a line with no '='", () => {
    const result = parseEnvVarsText("not-a-valid-line");
    expect(result).toEqual({ ok: false, error: expect.stringContaining("not-a-valid-line") });
  });

  it("rejects an invalid variable name", () => {
    const result = parseEnvVarsText("1INVALID=x");
    expect(result.ok).toBe(false);
  });

  it("rejects a variable name with a space", () => {
    const result = parseEnvVarsText("MY VAR=x");
    expect(result.ok).toBe(false);
  });
});

describe("formatEnvVarsText", () => {
  it("round-trips through parseEnvVarsText", () => {
    const vars = { FOO: "bar", BAZ: "qux with spaces" };
    const text = formatEnvVarsText(vars);
    expect(parseEnvVarsText(text)).toEqual({ ok: true, vars });
  });

  it("formats an empty object as an empty string", () => {
    expect(formatEnvVarsText({})).toBe("");
  });
});
