import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 }).allowed).toBe(true);
    }
  });

  it("blocks once the limit is reached within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    const blocked = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    checkRateLimit(keyA, { limit: 1, windowMs: 60_000 });
    expect(checkRateLimit(keyA, { limit: 1, windowMs: 60_000 }).allowed).toBe(false);
    expect(checkRateLimit(keyB, { limit: 1, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("reports decreasing remaining as requests are made", () => {
    const key = `test-remaining-${Math.random()}`;
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(2);
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(1);
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(0);
  });

  it("allows requests again once the window actually elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const key = `test-window-${Math.random()}`;

    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).allowed).toBe(false);

    vi.setSystemTime(999);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).allowed).toBe(false);

    vi.setSystemTime(1001);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).allowed).toBe(true);
  });

  it("computes retryAfterMs against the oldest request still inside the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const key = `test-retry-${Math.random()}`;

    checkRateLimit(key, { limit: 1, windowMs: 1000 });
    vi.setSystemTime(400);
    const blocked = checkRateLimit(key, { limit: 1, windowMs: 1000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(600);
  });
});
