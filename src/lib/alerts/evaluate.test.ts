import { describe, expect, it, vi, beforeEach } from "vitest";
import { alertEvents, alertRules, metrics } from "@/lib/db/schema";

const sendAlertWebhookMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("./webhook", () => ({ sendAlertWebhook: sendAlertWebhookMock }));

const { evaluateAlertRule } = await import("./evaluate");
type Db = Parameters<typeof evaluateAlertRule>[0];

type Call =
  | { op: "insert"; table: unknown; values: Record<string, unknown> }
  | { op: "update"; table: unknown; values: Record<string, unknown> };

let calls: Call[] = [];
let metricRows: Array<{ value: string }> = [];
let firingEvent: Record<string, unknown> | null = null;

function makeFakeDb(): Db {
  return {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          if (table === metrics) return Promise.resolve(metricRows);
          if (table === alertEvents) return Promise.resolve(firingEvent ? [firingEvent] : []);
          throw new Error("unexpected table in select()");
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        calls.push({ op: "insert", table, values });
        return Promise.resolve();
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          calls.push({ op: "update", table, values });
          return Promise.resolve();
        },
      }),
    }),
  } as unknown as Db;
}

function makeRule(overrides: Partial<typeof alertRules.$inferSelect> = {}): typeof alertRules.$inferSelect {
  return {
    id: "rule-1",
    serviceId: "svc-1",
    metricName: "error_rate",
    comparator: "gt",
    threshold: "5",
    windowMinutes: 5,
    webhookUrl: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("evaluateAlertRule", () => {
  beforeEach(() => {
    calls = [];
    metricRows = [];
    firingEvent = null;
    sendAlertWebhookMock.mockClear();
  });

  it("returns no-data and does nothing when the window is empty", async () => {
    const result = await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(result).toEqual({ outcome: "no-data", currentValue: null });
    expect(calls).toHaveLength(0);
  });

  it("opens a new firing event when the average breaches and nothing is already firing", async () => {
    metricRows = [{ value: "8" }, { value: "10" }]; // avg 9, threshold 5, comparator gt -> breaching
    const result = await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(result).toEqual({ outcome: "fired", currentValue: 9 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ op: "insert", values: { status: "firing", triggerValue: "9" } });
  });

  it("does not open a second event when one is already firing and still breaching", async () => {
    metricRows = [{ value: "9" }];
    firingEvent = { id: "existing-event" };
    const result = await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(result).toEqual({ outcome: "unchanged", currentValue: 9 });
    expect(calls).toHaveLength(0);
  });

  it("resolves the firing event once the average drops back under the threshold", async () => {
    metricRows = [{ value: "2" }]; // below threshold of 5
    firingEvent = { id: "existing-event" };
    const result = await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(result).toEqual({ outcome: "resolved", currentValue: 2 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ op: "update", values: { status: "resolved" } });
  });

  it("does nothing when healthy and nothing is firing", async () => {
    metricRows = [{ value: "1" }];
    const result = await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(result).toEqual({ outcome: "unchanged", currentValue: 1 });
    expect(calls).toHaveLength(0);
  });

  it("respects the lt comparator for a 'value dropped too low' rule", async () => {
    metricRows = [{ value: "40" }];
    const rule = makeRule({ metricName: "requests_per_min", comparator: "lt", threshold: "50" });
    const result = await evaluateAlertRule(makeFakeDb(), rule);
    expect(result.outcome).toBe("fired");
  });

  it("throws on a corrupted comparator instead of silently evaluating garbage", async () => {
    const rule = makeRule({ comparator: "invalid" as never });
    await expect(evaluateAlertRule(makeFakeDb(), rule)).rejects.toThrow(/invalid comparator/);
  });

  it("does not call the webhook when a rule has none configured", async () => {
    metricRows = [{ value: "9" }];
    await evaluateAlertRule(makeFakeDb(), makeRule());
    expect(sendAlertWebhookMock).not.toHaveBeenCalled();
  });

  it("sends a 'fired' webhook when a rule with a webhookUrl newly breaches", async () => {
    metricRows = [{ value: "9" }];
    const rule = makeRule({ webhookUrl: "https://example.com/hook" });
    await evaluateAlertRule(makeFakeDb(), rule);
    expect(sendAlertWebhookMock).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({ event: "fired", ruleId: "rule-1", currentValue: 9 })
    );
  });

  it("sends a 'resolved' webhook when a rule with a webhookUrl recovers", async () => {
    metricRows = [{ value: "2" }];
    firingEvent = { id: "existing-event" };
    const rule = makeRule({ webhookUrl: "https://example.com/hook" });
    await evaluateAlertRule(makeFakeDb(), rule);
    expect(sendAlertWebhookMock).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({ event: "resolved", currentValue: 2 })
    );
  });

  it("does not call the webhook when a still-breaching rule stays unchanged", async () => {
    metricRows = [{ value: "9" }];
    firingEvent = { id: "existing-event" };
    const rule = makeRule({ webhookUrl: "https://example.com/hook" });
    await evaluateAlertRule(makeFakeDb(), rule);
    expect(sendAlertWebhookMock).not.toHaveBeenCalled();
  });
});
