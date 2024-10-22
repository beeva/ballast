import { describe, expect, it } from "vitest";
import { cn, formatDate, formatDuration, formatRelativeTime, truncate } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatDate", () => {
  it("formats a Date and an ISO string the same way", () => {
    const date = new Date("2024-11-01T12:00:00Z");
    expect(formatDate(date)).toBe(formatDate("2024-11-01T12:00:00Z"));
    expect(formatDate(date)).toMatch(/Nov/);
  });

  it("degrades gracefully on an invalid date instead of throwing", () => {
    expect(formatDate(new Date("not-a-date"))).toBe("unknown date");
    expect(formatDate("also not a date")).toBe("unknown date");
  });
});

describe("formatRelativeTime", () => {
  it("describes a moment a few seconds ago", () => {
    const fiveSecondsAgo = new Date(Date.now() - 5_000);
    expect(formatRelativeTime(fiveSecondsAgo)).toMatch(/second/);
  });

  it("describes a moment about an hour ago", () => {
    const anHourAgo = new Date(Date.now() - 60 * 60_000);
    expect(formatRelativeTime(anHourAgo)).toMatch(/hour/);
  });

  it("describes a moment in the future, not just the past", () => {
    const inAnHour = new Date(Date.now() + 60 * 60_000);
    const result = formatRelativeTime(inAnHour);
    expect(result).toMatch(/hour/);
    expect(result).toMatch(/in /);
  });

  it("degrades gracefully on an invalid date instead of throwing", () => {
    expect(formatRelativeTime(new Date("not-a-date"))).toBe("unknown time");
  });
});

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds an ellipsis when text exceeds the length", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });
});

describe("formatDuration", () => {
  it("formats sub-second durations in ms", () => {
    expect(formatDuration(850)).toBe("850ms");
    expect(formatDuration(0)).toBe("0ms");
  });

  it("formats seconds without a minutes component", () => {
    expect(formatDuration(45_000)).toBe("45s");
  });

  it("formats minutes and seconds together", () => {
    expect(formatDuration(102_000)).toBe("1m 42s");
  });

  it("rounds to the nearest second", () => {
    expect(formatDuration(1499)).toBe("1s");
    expect(formatDuration(1500)).toBe("2s");
  });
});
